create or replace function public.cleanup_profile_gesture_notification() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.notifications
  where recipient_id = old.recipient_id and actor_id = old.sender_id and type = 'gesture' and entity_id = old.recipient_id;
  return old;
end;
$$;
create trigger profile_gestures_cleanup_notification after delete on public.profile_gestures for each row execute function public.cleanup_profile_gesture_notification();