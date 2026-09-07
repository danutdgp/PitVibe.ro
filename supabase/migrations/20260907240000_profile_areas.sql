-- Cartier/localitate declarată, cu vizibilitate controlată separat.
create type public.local_area_kind as enum ('neighborhood', 'nearby');

create table public.local_areas (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(name) between 2 and 60),
  kind public.local_area_kind not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.profile_areas (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  area_id bigint not null references public.local_areas(id) on delete restrict,
  visible boolean not null default false,
  updated_at timestamptz not null default now()
);

create index profile_areas_area_visible_idx on public.profile_areas(area_id) where visible;
create trigger profile_areas_set_updated_at before update on public.profile_areas for each row execute function public.set_updated_at();

insert into public.local_areas(slug, name, kind, sort_order) values
  ('centru', 'Centru', 'neighborhood', 10), ('trivale', 'Trivale', 'neighborhood', 20),
  ('gavana', 'Găvana', 'neighborhood', 30), ('prundu', 'Prundu', 'neighborhood', 40),
  ('craiovei', 'Craiovei', 'neighborhood', 50), ('razboieni', 'Războieni', 'neighborhood', 60),
  ('tudor-vladimirescu', 'Tudor Vladimirescu', 'neighborhood', 70), ('exercitiu', 'Exercițiu', 'neighborhood', 80),
  ('nord', 'Nord', 'neighborhood', 90), ('banat', 'Banat', 'neighborhood', 100),
  ('popa-sapca', 'Popa Șapcă', 'neighborhood', 110), ('eremia-grigorescu', 'Eremia Grigorescu', 'neighborhood', 120),
  ('negru-voda', 'Negru Vodă', 'neighborhood', 130), ('mioveni', 'Mioveni', 'nearby', 210),
  ('stefanesti', 'Ștefănești', 'nearby', 220), ('bradu', 'Bradu', 'nearby', 230),
  ('bascov', 'Bascov', 'nearby', 240), ('maracineni', 'Mărăcineni', 'nearby', 250),
  ('mosoaia', 'Moșoaia', 'nearby', 260), ('albota', 'Albota', 'nearby', 270),
  ('calinesti', 'Călinești', 'nearby', 280);

alter table public.local_areas enable row level security;
alter table public.profile_areas enable row level security;
create policy "local_areas_read_active" on public.local_areas for select to authenticated using (active or public.has_role('admin'));
create policy "local_areas_admin_manage" on public.local_areas for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "profile_areas_read_allowed" on public.profile_areas for select to authenticated using (user_id = auth.uid() or (visible and public.can_view_profile(user_id)));
create policy "profile_areas_create_self" on public.profile_areas for insert to authenticated with check (user_id = auth.uid());
create policy "profile_areas_update_self" on public.profile_areas for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profile_areas_delete_self" on public.profile_areas for delete to authenticated using (user_id = auth.uid());
