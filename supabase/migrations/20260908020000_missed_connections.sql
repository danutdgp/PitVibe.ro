-- Secțiune separată pentru anunțuri despre întâlniri ratate.
create table public.missed_connections (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  description text not null check (char_length(description) between 10 and 2000),
  vehicle_make text not null check (char_length(vehicle_make) between 2 and 50),
  license_plate text not null check (license_plate ~ '^[A-Z]{1,2}[0-9]{2,3}[A-Z]{1,3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index missed_connections_created_idx on public.missed_connections(created_at desc, id desc);
create index missed_connections_plate_idx on public.missed_connections(license_plate);

create trigger missed_connections_set_updated_at before update on public.missed_connections for each row execute function public.set_updated_at();

alter table public.missed_connections enable row level security;

create policy "missed_connections_read_visible" on public.missed_connections for select to authenticated
  using (public.can_view_profile(author_id));
create policy "missed_connections_create_self" on public.missed_connections for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_user());
create policy "missed_connections_update_self" on public.missed_connections for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "missed_connections_delete_self" on public.missed_connections for delete to authenticated
  using (author_id = auth.uid());