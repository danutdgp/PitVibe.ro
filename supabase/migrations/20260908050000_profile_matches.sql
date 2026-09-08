-- Match-uri create prin acceptarea unui gest.
create table public.profile_matches (
  user_one uuid not null references public.profiles(id) on delete cascade,
  user_two uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_one, user_two),
  constraint profile_match_order check (user_one < user_two)
);

create index profile_matches_user_two_idx on public.profile_matches(user_two, created_at desc);
alter table public.profile_matches enable row level security;
create policy "profile_matches_read_self" on public.profile_matches for select to authenticated using (auth.uid() in (user_one, user_two));
create policy "profile_matches_create_participants" on public.profile_matches for insert to authenticated with check (auth.uid() in (user_one, user_two) and public.is_active_user());