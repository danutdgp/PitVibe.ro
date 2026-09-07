-- Etapa 4: mesaje, notificări, raportări și moderare.
create type public.conversation_status as enum ('requested', 'accepted', 'rejected');
create type public.notification_type as enum ('follow', 'follow_request', 'follow_accepted', 'like', 'comment', 'event_interest', 'message_request', 'message');
create type public.report_target as enum ('profile', 'post', 'comment', 'event', 'message');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

alter table public.posts add column removed_at timestamptz;
alter table public.comments add column removed_at timestamptz;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status public.conversation_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint different_participants check (requester_id <> recipient_id)
);
create unique index conversations_pair_idx on public.conversations (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'nudity', 'violence', 'minor_safety', 'misinformation', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  reported_message_snapshot text,
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  resolution_notes text check (char_length(resolution_notes) <= 1000),
  created_at timestamptz not null default now()
);
create unique index reports_open_unique_idx on public.reports(reporter_id, target_type, target_id) where status in ('open', 'reviewing');
create index conversations_requester_idx on public.conversations(requester_id, updated_at desc);
create index conversations_recipient_idx on public.conversations(recipient_id, updated_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);
create index notifications_recipient_idx on public.notifications(recipient_id, read_at, created_at desc);
create index reports_queue_idx on public.reports(status, created_at);

create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger messages_set_updated_at before update on public.messages for each row execute function public.set_updated_at();

create or replace function public.is_active_user(target_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = target_user and suspended_at is null);
$$;

create or replace function public.protect_conversation_participants() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.requester_id <> old.requester_id or new.recipient_id <> old.recipient_id then raise exception 'Participanții nu pot fi modificați'; end if;
  return new;
end;
$$;
create trigger conversations_immutable_participants before update on public.conversations for each row execute function public.protect_conversation_participants();

create or replace function public.notify_user(target uuid, actor uuid, notification_kind public.notification_type, target_entity uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if target is null or target = actor or public.users_are_blocked(target, actor) then return; end if;
  insert into public.notifications(recipient_id, actor_id, type, entity_id) values(target, actor, notification_kind, target_entity);
end;
$$;

create or replace function public.create_social_notification() returns trigger language plpgsql security definer set search_path = '' as $$
declare target_user uuid;
begin
  if tg_table_name = 'follows' then perform public.notify_user(new.followed_id, new.follower_id, case when new.status = 'pending' then 'follow_request'::public.notification_type else 'follow'::public.notification_type end, new.follower_id);
  elsif tg_table_name = 'post_likes' then select author_id into target_user from public.posts where id = new.post_id; perform public.notify_user(target_user, new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then select author_id into target_user from public.posts where id = new.post_id; perform public.notify_user(target_user, new.author_id, 'comment', new.post_id);
  elsif tg_table_name = 'event_interests' then select organizer_id into target_user from public.events where id = new.event_id; perform public.notify_user(target_user, new.user_id, 'event_interest', new.event_id);
  end if;
  return new;
end;
$$;
create trigger follows_notify after insert on public.follows for each row execute function public.create_social_notification();
create trigger likes_notify after insert on public.post_likes for each row execute function public.create_social_notification();
create trigger comments_notify after insert on public.comments for each row execute function public.create_social_notification();
create trigger event_interests_notify after insert on public.event_interests for each row execute function public.create_social_notification();

create or replace function public.notify_follow_acceptance() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then perform public.notify_user(new.follower_id, new.followed_id, 'follow_accepted', new.followed_id); end if;
  return new;
end;
$$;
create trigger follows_accept_notify after update of status on public.follows for each row execute function public.notify_follow_acceptance();

create or replace function public.request_conversation(target_recipient uuid, initial_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conversation_id uuid;
begin
  if auth.uid() is null or not public.is_active_user() or target_recipient = auth.uid() or char_length(trim(initial_message)) not between 1 and 4000 or public.users_are_blocked(auth.uid(), target_recipient) then raise exception 'Cererea nu este permisă'; end if;
  if not public.is_active_user(target_recipient) then raise exception 'Destinatar indisponibil'; end if;
  insert into public.conversations(requester_id, recipient_id) values(auth.uid(), target_recipient) returning id into conversation_id;
  insert into public.messages(conversation_id, sender_id, content) values(conversation_id, auth.uid(), trim(initial_message));
  perform public.notify_user(target_recipient, auth.uid(), 'message_request', conversation_id);
  return conversation_id;
end;
$$;

create or replace function public.message_notification() returns trigger language plpgsql security definer set search_path = '' as $$
declare target_user uuid; conversation_state public.conversation_status;
begin
  select case when requester_id = new.sender_id then recipient_id else requester_id end, status into target_user, conversation_state from public.conversations where id = new.conversation_id;
  if conversation_state = 'accepted' then perform public.notify_user(target_user, new.sender_id, 'message', new.conversation_id); end if;
  return new;
end;
$$;
create trigger messages_notify after insert on public.messages for each row execute function public.message_notification();

create or replace function public.report_content(report_type public.report_target, report_target uuid, report_reason text, report_details text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare report_id uuid; snapshot text; allowed boolean := false;
begin
  if auth.uid() is null or not public.is_active_user() then raise exception 'Raportarea nu este permisă'; end if;
  case report_type
    when 'profile' then allowed := public.can_view_profile(report_target);
    when 'post' then allowed := public.can_view_post(report_target);
    when 'comment' then allowed := exists(select 1 from public.comments c where c.id = report_target and public.can_view_post(c.post_id));
    when 'event' then allowed := exists(select 1 from public.events e where e.id = report_target and (e.organizer_id is null or public.can_view_profile(e.organizer_id)));
    when 'message' then select m.content, exists(select 1 from public.conversations c where c.id = m.conversation_id and auth.uid() in (c.requester_id, c.recipient_id)) into snapshot, allowed from public.messages m where m.id = report_target;
  end case;
  if not coalesce(allowed, false) or report_reason not in ('spam','harassment','hate','nudity','violence','minor_safety','misinformation','other') then raise exception 'Raport invalid'; end if;
  insert into public.reports(reporter_id, target_type, target_id, reason, details, reported_message_snapshot) values(auth.uid(), report_type, report_target, report_reason, left(coalesce(report_details,''),1000), snapshot) returning id into report_id;
  return report_id;
end;
$$;

create or replace function public.moderate_user(target_user uuid, suspend boolean, action_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.has_role('moderator') or public.has_role('admin')) or target_user = auth.uid() or char_length(trim(action_reason)) < 2 then raise exception 'Acțiune nepermisă'; end if;
  update public.profiles set suspended_at = case when suspend then now() else null end where id = target_user;
  insert into public.moderation_actions(moderator_id, target_user_id, action, reason) values(auth.uid(), target_user, case when suspend then 'suspend_user' else 'restore_user' end, trim(action_reason));
end;
$$;

create or replace function public.moderate_remove_content(content_type public.report_target, content_id uuid, action_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.has_role('moderator') or public.has_role('admin')) or char_length(trim(action_reason)) < 2 then raise exception 'Acțiune nepermisă'; end if;
  case content_type
    when 'post' then update public.posts set removed_at = now() where id = content_id;
    when 'comment' then update public.comments set removed_at = now() where id = content_id;
    when 'event' then update public.events set status = 'cancelled' where id = content_id;
    when 'message' then update public.messages set content = '[mesaj eliminat de moderare]', removed_at = now() where id = content_id;
    else raise exception 'Tipul nu poate fi eliminat';
  end case;
  insert into public.moderation_actions(moderator_id, action, reason, metadata) values(auth.uid(), 'remove_' || content_type::text, trim(action_reason), jsonb_build_object('target_id', content_id));
end;
$$;

create or replace function public.review_report(target_report uuid, new_status public.report_status, notes text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.has_role('moderator') or public.has_role('admin')) or new_status not in ('resolved','dismissed') then raise exception 'Acțiune nepermisă'; end if;
  update public.reports set status = new_status, reviewed_by = auth.uid(), reviewed_at = now(), resolution_notes = left(coalesce(notes,''),1000) where id = target_report and status in ('open','reviewing');
  insert into public.moderation_actions(moderator_id, action, reason, metadata) values(auth.uid(), 'review_report', coalesce(nullif(trim(notes),''), new_status::text), jsonb_build_object('report_id', target_report, 'status', new_status));
end;
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
create policy "conversations_participants_read" on public.conversations for select to authenticated using (auth.uid() in (requester_id, recipient_id));
create policy "conversations_recipient_respond" on public.conversations for update to authenticated using (recipient_id = auth.uid() and status = 'requested') with check (recipient_id = auth.uid() and status in ('accepted','rejected'));
create policy "messages_participants_read" on public.messages for select to authenticated using (exists(select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.requester_id, c.recipient_id)));
create policy "messages_send_accepted" on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_active_user() and exists(select 1 from public.conversations c where c.id = conversation_id and c.status = 'accepted' and auth.uid() in (c.requester_id, c.recipient_id) and not public.users_are_blocked(c.requester_id, c.recipient_id)));
create policy "messages_update_self" on public.messages for update to authenticated using (sender_id = auth.uid() and removed_at is null) with check (sender_id = auth.uid());
create policy "notifications_private" on public.notifications for select to authenticated using (recipient_id = auth.uid() and (actor_id is null or not public.users_are_blocked(recipient_id, actor_id)));
create policy "notifications_mark_read" on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "reports_read_own_or_staff" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.has_role('moderator') or public.has_role('admin'));

drop policy "posts_read_visible" on public.posts;
create policy "posts_read_visible" on public.posts for select to authenticated using (removed_at is null and public.can_view_private_content(author_id));
drop policy "comments_read_visible" on public.comments;
create policy "comments_read_visible" on public.comments for select to authenticated using (removed_at is null and public.can_view_post(post_id));

create or replace function public.cleanup_contacts_on_block() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.notifications where (recipient_id = new.blocker_id and actor_id = new.blocked_id) or (recipient_id = new.blocked_id and actor_id = new.blocker_id);
  update public.conversations set status = 'rejected', responded_at = now() where status = 'requested' and ((requester_id = new.blocker_id and recipient_id = new.blocked_id) or (requester_id = new.blocked_id and recipient_id = new.blocker_id));
  return new;
end;
$$;
create trigger blocks_cleanup_contacts after insert on public.blocks for each row execute function public.cleanup_contacts_on_block();
