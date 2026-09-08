-- Gesturi de interes: trandafir pentru femei, scânteie pentru bărbați.
create type public.profile_gender as enum ('female', 'male');
alter table public.profiles add column gender public.profile_gender;

alter type public.notification_type add value 'gesture';

create table public.profile_gestures (
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  gesture_type text not null check (gesture_type in ('rose', 'spark')),
  created_at timestamptz not null default now(),
  primary key (sender_id, recipient_id),
  constraint profile_gesture_different_users check (sender_id <> recipient_id)
);

create index profile_gestures_recipient_idx on public.profile_gestures(recipient_id, created_at desc);
alter table public.profile_gestures enable row level security;
create policy "profile_gestures_read_participants" on public.profile_gestures for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "profile_gestures_create_self" on public.profile_gestures for insert to authenticated with check (sender_id = auth.uid() and public.is_active_user() and not public.users_are_blocked(sender_id, recipient_id));
create policy "profile_gestures_delete_self" on public.profile_gestures for delete to authenticated using (sender_id = auth.uid());

create or replace function public.prepare_profile_gesture() returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient_gender public.profile_gender;
begin
  select gender into recipient_gender from public.profiles where id = new.recipient_id and suspended_at is null;
  if recipient_gender is null then raise exception 'Acest profil nu are un gest disponibil'; end if;
  new.gesture_type := case when recipient_gender = 'female' then 'rose' else 'spark' end;
  return new;
end;
$$;
create trigger profile_gestures_prepare before insert on public.profile_gestures for each row execute function public.prepare_profile_gesture();

create or replace function public.profile_gesture_notification() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify_user(new.recipient_id, new.sender_id, 'gesture', new.recipient_id);
  return new;
end;
$$;
create trigger profile_gestures_notify after insert on public.profile_gestures for each row execute function public.profile_gesture_notification();