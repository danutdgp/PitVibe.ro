-- Notificări grupate, confirmări de citire și liste de conexiuni.
alter table public.messages
  add column delivered_at timestamptz not null default now(),
  add column seen_at timestamptz;

delete from public.notifications older
using public.notifications newer
where older.id < newer.id
  and older.recipient_id = newer.recipient_id
  and older.type = 'message'
  and newer.type = 'message'
  and older.entity_id = newer.entity_id;

create unique index notifications_unread_message_conversation_idx
on public.notifications(recipient_id, type, entity_id)
where type = 'message';

create or replace function public.message_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target_user uuid; conversation_state public.conversation_status;
begin
  select case when requester_id = new.sender_id then recipient_id else requester_id end, status
  into target_user, conversation_state
  from public.conversations where id = new.conversation_id;

  if conversation_state = 'accepted'
    and target_user <> new.sender_id
    and not public.users_are_blocked(target_user, new.sender_id) then
    insert into public.notifications(recipient_id, actor_id, type, entity_id)
    values(target_user, new.sender_id, 'message', new.conversation_id)
    on conflict (recipient_id, type, entity_id)
      where type = 'message'
    do update set actor_id = excluded.actor_id, created_at = now(), read_at = null;
  end if;
  return new;
end;
$$;

create or replace function public.mark_conversation_seen(target_conversation uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare marked_notifications integer := 0;
begin
  if auth.uid() is null or not exists(
    select 1 from public.conversations
    where id = target_conversation and auth.uid() in (requester_id, recipient_id)
  ) then
    raise exception 'Conversație indisponibilă';
  end if;

  update public.messages
  set seen_at = coalesce(seen_at, now())
  where conversation_id = target_conversation and sender_id <> auth.uid() and seen_at is null;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where recipient_id = auth.uid()
    and entity_id = target_conversation
    and type in ('message', 'message_request')
    and read_at is null;
  get diagnostics marked_notifications = row_count;
  return marked_notifications;
end;
$$;

create or replace function public.profile_connections(target_user uuid, connection_kind text)
returns table(user_id uuid, username text, display_name text, avatar_path text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.avatar_path
  from public.follows f
  join public.profiles p on p.id = case
    when connection_kind = 'followers' then f.follower_id
    else f.followed_id
  end
  where f.status = 'accepted'
    and connection_kind in ('followers', 'following')
    and public.can_view_profile(target_user)
    and not public.users_are_blocked(auth.uid(), p.id)
    and (
      (connection_kind = 'followers' and f.followed_id = target_user)
      or (connection_kind = 'following' and f.follower_id = target_user)
    )
  order by p.display_name, p.username;
$$;

revoke all on function public.mark_conversation_seen(uuid) from public;
grant execute on function public.mark_conversation_seen(uuid) to authenticated;
revoke all on function public.profile_connections(uuid, text) from public;
grant execute on function public.profile_connections(uuid, text) to authenticated;
