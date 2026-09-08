create or replace function public.prepare_profile_gesture() returns trigger language plpgsql security definer set search_path = '' as $$
declare sender_gender public.profile_gender; recipient_gender public.profile_gender;
begin
  select gender into sender_gender from public.profiles where id = new.sender_id and suspended_at is null;
  select gender into recipient_gender from public.profiles where id = new.recipient_id and suspended_at is null;
  if sender_gender is null or recipient_gender is null or sender_gender = recipient_gender then raise exception 'Gestul este disponibil doar între genuri diferite'; end if;
  new.gesture_type := case when sender_gender = 'male' and recipient_gender = 'female' then 'rose' else 'spark' end;
  return new;
end;
$$;