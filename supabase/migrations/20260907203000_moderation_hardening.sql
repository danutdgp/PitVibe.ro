-- Întărirea suspendărilor și context limitat pentru raportări.
alter table public.reports add column content_snapshot jsonb not null default '{}'::jsonb;

create or replace function public.report_content(report_type public.report_target, report_target uuid, report_reason text, report_details text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare report_id uuid; snapshot text; context jsonb := '{}'::jsonb; allowed boolean := false;
begin
  if auth.uid() is null or not public.is_active_user() then raise exception 'Raportarea nu este permisă'; end if;
  case report_type
    when 'profile' then select public.can_view_profile(p.id), jsonb_build_object('username', p.username, 'display_name', p.display_name, 'bio', p.bio) into allowed, context from public.profiles p where p.id = report_target;
    when 'post' then select public.can_view_post(p.id), jsonb_build_object('content', p.content, 'author_id', p.author_id) into allowed, context from public.posts p where p.id = report_target;
    when 'comment' then select public.can_view_post(c.post_id), jsonb_build_object('content', c.content, 'author_id', c.author_id, 'post_id', c.post_id) into allowed, context from public.comments c where c.id = report_target;
    when 'event' then select (e.organizer_id is null or public.can_view_profile(e.organizer_id)), jsonb_build_object('title', e.title, 'description', e.description, 'organizer_id', e.organizer_id) into allowed, context from public.events e where e.id = report_target;
    when 'message' then select m.content, exists(select 1 from public.conversations c where c.id = m.conversation_id and auth.uid() in (c.requester_id, c.recipient_id)), jsonb_build_object('content', m.content, 'sender_id', m.sender_id) into snapshot, allowed, context from public.messages m where m.id = report_target;
  end case;
  if not coalesce(allowed, false) or report_reason not in ('spam','harassment','hate','nudity','violence','minor_safety','misinformation','other') then raise exception 'Raport invalid'; end if;
  insert into public.reports(reporter_id, target_type, target_id, reason, details, reported_message_snapshot, content_snapshot) values(auth.uid(), report_type, report_target, report_reason, left(coalesce(report_details,''),1000), snapshot, context) returning id into report_id;
  return report_id;
end;
$$;

create or replace function public.notify_conversation_acceptance() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'requested' and new.status = 'accepted' then perform public.notify_user(new.requester_id, new.recipient_id, 'message', new.id); end if;
  return new;
end;
$$;
create trigger conversations_accept_notify after update of status on public.conversations for each row execute function public.notify_conversation_acceptance();

create policy "profiles_staff_read" on public.profiles for select to authenticated using (public.has_role('moderator') or public.has_role('admin'));

drop policy "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid() and public.is_active_user()) with check (id = auth.uid() and public.is_active_user());
drop policy "profile_interests_manage_self" on public.profile_interests;
create policy "profile_interests_manage_self" on public.profile_interests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active_user());
drop policy "follows_create_self" on public.follows;
create policy "follows_create_self" on public.follows for insert to authenticated with check (follower_id = auth.uid() and public.is_active_user() and not public.users_are_blocked(follower_id, followed_id));
drop policy "posts_create_self" on public.posts;
create policy "posts_create_self" on public.posts for insert to authenticated with check (author_id = auth.uid() and public.is_active_user());
drop policy "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts for update to authenticated using (author_id = auth.uid() and public.is_active_user()) with check (author_id = auth.uid() and public.is_active_user());
drop policy "likes_create_self" on public.post_likes;
create policy "likes_create_self" on public.post_likes for insert to authenticated with check (user_id = auth.uid() and public.is_active_user() and public.can_view_post(post_id));
drop policy "comments_create_self" on public.comments;
create policy "comments_create_self" on public.comments for insert to authenticated with check (author_id = auth.uid() and public.is_active_user() and public.can_view_post(post_id));
drop policy "comments_update_self" on public.comments;
create policy "comments_update_self" on public.comments for update to authenticated using (author_id = auth.uid() and public.is_active_user()) with check (author_id = auth.uid() and public.is_active_user());
drop policy "saves_private" on public.saved_posts;
create policy "saves_private" on public.saved_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active_user() and public.can_view_post(post_id));
drop policy "outings_create_self" on public.events;
create policy "outings_create_self" on public.events for insert to authenticated with check (organizer_id = auth.uid() and kind = 'outing' and public.is_active_user());
drop policy "outings_update_self" on public.events;
create policy "outings_update_self" on public.events for update to authenticated using (organizer_id = auth.uid() and kind = 'outing' and public.is_active_user()) with check (organizer_id = auth.uid() and kind = 'outing' and public.is_active_user());
drop policy "event_interests_create_self" on public.event_interests;
create policy "event_interests_create_self" on public.event_interests for insert to authenticated with check (user_id = auth.uid() and public.is_active_user() and exists(select 1 from public.events e where e.id = event_id and e.status = 'active' and e.starts_at > now()));
drop policy "blocks_create_self" on public.blocks;
create policy "blocks_create_self" on public.blocks for insert to authenticated with check (blocker_id = auth.uid() and public.is_active_user());
