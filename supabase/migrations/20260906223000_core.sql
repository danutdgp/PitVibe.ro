-- PitiVibe: fundația conturilor, profilurilor și autorizării.
create extension if not exists citext with schema extensions;

create type public.app_role as enum ('user', 'moderator', 'admin');
create type public.profile_visibility as enum ('public', 'private');
create type public.relationship_status as enum ('single', 'uncertain', 'in_relationship');
create type public.follow_status as enum ('pending', 'accepted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null default 'Membru PitiVibe',
  bio text not null default '',
  city text not null default 'Pitești',
  avatar_path text,
  visibility public.profile_visibility not null default 'public',
  relationship_status public.relationship_status,
  show_relationship_status boolean not null default false,
  dating_discovery_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username::text ~ '^[a-z0-9_]{3,24}$'),
  constraint display_name_length check (char_length(display_name) between 2 and 50),
  constraint bio_length check (char_length(bio) <= 500),
  constraint city_length check (char_length(city) between 2 and 60),
  constraint hidden_status_consistency check (show_relationship_status = false or relationship_status is not null)
);

create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  birth_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null,
  primary key (user_id, role)
);

create table public.interests (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null unique check (char_length(label) between 2 and 40),
  active boolean not null default true
);

create table public.profile_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  status public.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (follower_id, followed_id),
  constraint cannot_follow_self check (follower_id <> followed_id),
  constraint accepted_timestamp check ((status = 'accepted' and accepted_at is not null) or (status = 'pending' and accepted_at is null))
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);

create table public.moderation_actions (
  id bigint generated always as identity primary key,
  moderator_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 2 and 80),
  reason text not null check (char_length(reason) between 2 and 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_city_idx on public.profiles(city) where suspended_at is null;
create index profiles_discovery_idx on public.profiles(dating_discovery_enabled) where dating_discovery_enabled and suspended_at is null;
create index follows_followed_status_idx on public.follows(followed_id, status);
create index follows_follower_status_idx on public.follows(follower_id, status);
create index blocks_blocked_idx on public.blocks(blocked_id);
create index profile_interests_interest_idx on public.profile_interests(interest_id, user_id);
create index moderation_actions_target_idx on public.moderation_actions(target_user_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger profile_private_set_updated_at before update on public.profile_private for each row execute function public.set_updated_at();

create or replace function public.enforce_minimum_age() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.birth_date > (current_date - interval '13 years')::date then raise exception 'PitiVibe este disponibil persoanelor de cel puțin 13 ani'; end if;
  if new.birth_date < (current_date - interval '120 years')::date then raise exception 'Data nașterii nu este validă'; end if;
  return new;
end;
$$;
create trigger profile_private_minimum_age before insert or update of birth_date on public.profile_private for each row execute function public.enforce_minimum_age();

create or replace function public.has_role(required_role public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = required_role);
$$;

create or replace function public.users_are_blocked(first_user uuid, second_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.blocks where (blocker_id = first_user and blocked_id = second_user) or (blocker_id = second_user and blocked_id = first_user));
$$;

create or replace function public.can_view_profile(target_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target_id = auth.uid() or (
    not public.users_are_blocked(auth.uid(), target_id)
    and exists (select 1 from public.profiles p where p.id = target_id and p.suspended_at is null)
  );
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, ('membru_' || left(replace(new.id::text, '-', ''), 12))::extensions.citext, 'Membru PitiVibe');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.user_roles enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.moderation_actions enable row level security;

create policy "profiles_visible_by_privacy" on public.profiles for select to authenticated using (public.can_view_profile(id));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "private_profile_self_only" on public.profile_private for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "roles_read_self" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "interests_read_authenticated" on public.interests for select to authenticated using (active or public.has_role('admin'));
create policy "interests_admin_manage" on public.interests for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "profile_interests_visible" on public.profile_interests for select to authenticated using (public.can_view_profile(user_id));
create policy "profile_interests_manage_self" on public.profile_interests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "follows_read_participants" on public.follows for select to authenticated using (follower_id = auth.uid() or followed_id = auth.uid());
create policy "follows_create_self" on public.follows for insert to authenticated with check (follower_id = auth.uid() and not public.users_are_blocked(follower_id, followed_id));
create policy "follows_accept_target" on public.follows for update to authenticated using (followed_id = auth.uid()) with check (followed_id = auth.uid());
create policy "follows_delete_participants" on public.follows for delete to authenticated using (follower_id = auth.uid() or followed_id = auth.uid());
create policy "blocks_read_self" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "blocks_create_self" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks_delete_self" on public.blocks for delete to authenticated using (blocker_id = auth.uid());
create policy "moderation_log_read_staff" on public.moderation_actions for select to authenticated using (public.has_role('moderator') or public.has_role('admin'));
create policy "moderation_log_insert_staff" on public.moderation_actions for insert to authenticated with check ((public.has_role('moderator') or public.has_role('admin')) and moderator_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "avatar_owner_read" on storage.objects for select to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()::text);
create policy "avatar_owner_insert" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and owner_id = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar_owner_update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()::text) with check (bucket_id = 'avatars' and owner_id = auth.uid()::text);
create policy "avatar_owner_delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()::text);

insert into public.interests (slug, label) values
  ('cafea', 'Cafea'), ('sport', 'Sport'), ('plimbari', 'Plimbări'), ('muzica', 'Muzică'), ('fotografie', 'Fotografie'), ('gastronomie', 'Gastronomie'), ('filme', 'Filme'), ('tehnologie', 'Tehnologie')
on conflict (slug) do nothing;
