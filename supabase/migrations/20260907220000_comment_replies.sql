-- Răspunsuri la comentarii, limitate la un singur nivel.
alter table public.comments add column parent_id uuid references public.comments(id) on delete cascade;
create index comments_parent_idx on public.comments(parent_id, created_at asc) where parent_id is not null;

create or replace function public.validate_comment_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parent_post uuid; parent_parent uuid;
begin
  if new.parent_id is null then return new; end if;
  select post_id, parent_id into parent_post, parent_parent from public.comments where id = new.parent_id;
  if parent_post is null or parent_post <> new.post_id or parent_parent is not null then
    raise exception 'Răspunsul la comentariu nu este valid';
  end if;
  return new;
end;
$$;
create trigger comments_validate_reply before insert or update of parent_id, post_id on public.comments for each row execute function public.validate_comment_reply();

create or replace function public.create_social_notification() returns trigger language plpgsql security definer set search_path = '' as $$
declare target_user uuid;
begin
  if tg_table_name = 'follows' then
    perform public.notify_user(new.followed_id, new.follower_id, case when new.status = 'pending' then 'follow_request'::public.notification_type else 'follow'::public.notification_type end, new.follower_id);
  elsif tg_table_name = 'post_likes' then
    select author_id into target_user from public.posts where id = new.post_id;
    perform public.notify_user(target_user, new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then
    if new.parent_id is not null then select author_id into target_user from public.comments where id = new.parent_id;
    else select author_id into target_user from public.posts where id = new.post_id;
    end if;
    perform public.notify_user(target_user, new.author_id, 'comment', new.post_id);
  elsif tg_table_name = 'event_interests' then
    select organizer_id into target_user from public.events where id = new.event_id;
    perform public.notify_user(target_user, new.user_id, 'event_interest', new.event_id);
  end if;
  return new;
end;
$$;
