create or replace function public.accept_profile_gesture(sender uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare conversation_id uuid;
begin
  if auth.uid() is null or sender = auth.uid() or not public.is_active_user() then raise exception 'Match invalid'; end if;
  if not exists(select 1 from public.profile_gestures where sender_id = sender and recipient_id = auth.uid()) then raise exception 'Gestul nu mai este disponibil'; end if;
  insert into public.profile_matches(user_one, user_two) values (least(auth.uid(), sender), greatest(auth.uid(), sender)) on conflict do nothing;
  select id into conversation_id from public.conversations where least(requester_id, recipient_id) = least(auth.uid(), sender) and greatest(requester_id, recipient_id) = greatest(auth.uid(), sender) limit 1;
  if conversation_id is null then
    insert into public.conversations(requester_id, recipient_id, status, responded_at) values(auth.uid(), sender, 'accepted', now()) returning id into conversation_id;
  else
    update public.conversations set status = 'accepted', responded_at = coalesce(responded_at, now()) where id = conversation_id;
  end if;
  return conversation_id;
end;
$$;