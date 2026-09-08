alter table public.profiles add column last_seen_at timestamptz not null default now();
create index profiles_last_seen_idx on public.profiles(last_seen_at desc) where suspended_at is null;