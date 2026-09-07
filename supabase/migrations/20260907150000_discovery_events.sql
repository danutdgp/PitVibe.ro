-- Etapa 3: descoperire, locuri și ieșiri.
create extension if not exists pg_trgm with schema extensions;
create type public.connection_intent as enum ('friendship', 'relationship', 'activities');
create type public.event_kind as enum ('outing', 'local_event');
create type public.event_status as enum ('active', 'cancelled');

alter table public.profiles add column dating_intentions public.connection_intent[] not null default '{}';
alter table public.profiles add constraint dating_intentions_consistency check (dating_discovery_enabled or cardinality(dating_intentions) = 0);
create index profiles_username_trgm_idx on public.profiles using gin ((username::text) extensions.gin_trgm_ops);
create index profiles_display_name_trgm_idx on public.profiles using gin (display_name extensions.gin_trgm_ops);
create index profiles_dating_intentions_idx on public.profiles using gin (dating_intentions);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  category text not null check (category in ('cafea', 'sport', 'plimbare', 'muzica', 'socializare')),
  description text not null default '' check (char_length(description) <= 1000),
  public_address text not null check (char_length(public_address) between 3 and 200),
  photo_path text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  kind public.event_kind not null default 'outing',
  organizer_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null check (category in ('cafea', 'sport', 'plimbare', 'muzica', 'socializare')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  place_id uuid references public.places(id) on delete set null,
  location_name text not null check (char_length(location_name) between 2 and 120),
  public_address text not null default '' check (char_length(public_address) <= 200),
  photo_path text,
  status public.event_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_time_order check (ends_at is null or ends_at > starts_at)
);

create table public.event_interests (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index places_category_active_idx on public.places(category, name) where active;
create index events_upcoming_idx on public.events(starts_at, id) where status = 'active';
create index events_category_upcoming_idx on public.events(category, starts_at) where status = 'active';
create index events_organizer_idx on public.events(organizer_id, starts_at desc);
create index event_interests_user_idx on public.event_interests(user_id, created_at desc);
create trigger places_set_updated_at before update on public.places for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();

create or replace function public.validate_event_start() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.starts_at <= now() then raise exception 'Data ieșirii trebuie să fie în viitor'; end if;
  return new;
end;
$$;
create trigger events_future_start before insert on public.events for each row execute function public.validate_event_start();

create or replace function public.search_profiles(search_text text, interest_filter bigint, dating_only boolean, status_filter public.relationship_status, intent_filter public.connection_intent, result_limit integer, result_offset integer)
returns table (id uuid, username extensions.citext, display_name text, bio text, city text, avatar_path text, visibility public.profile_visibility, relationship_status public.relationship_status, dating_discovery_enabled boolean, shared_interests bigint)
language sql stable set search_path = '' as $$
  select p.id, p.username, p.display_name, p.bio, p.city, p.avatar_path, p.visibility,
    case when p.show_relationship_status then p.relationship_status else null end,
    p.dating_discovery_enabled,
    (select count(*) from public.profile_interests mine join public.profile_interests theirs on mine.interest_id = theirs.interest_id where mine.user_id = auth.uid() and theirs.user_id = p.id)
  from public.profiles p
  where p.id <> auth.uid() and p.suspended_at is null and public.can_view_profile(p.id)
    and (coalesce(search_text, '') = '' or p.username::text ilike '%' || search_text || '%' or p.display_name ilike '%' || search_text || '%')
    and (interest_filter is null or exists(select 1 from public.profile_interests pi where pi.user_id = p.id and pi.interest_id = interest_filter))
    and (not dating_only or p.dating_discovery_enabled)
    and (status_filter is null or (p.show_relationship_status and p.relationship_status = status_filter))
    and (intent_filter is null or (p.dating_discovery_enabled and intent_filter = any(p.dating_intentions)))
  order by 10 desc, p.display_name asc, p.id
  limit least(greatest(result_limit, 1), 40) offset greatest(result_offset, 0);
$$;

create or replace function public.list_upcoming_events(time_filter text, category_filter text, result_limit integer, result_offset integer)
returns setof public.events language sql stable set search_path = '' as $$
  with local_clock as (
    select timezone('Europe/Bucharest', now())::date as today
  ), bounds as (
    select today, today + (6 - extract(isodow from today)::int) as saturday
    from local_clock
  )
  select e.* from public.events e cross join bounds b
  where e.status = 'active' and e.starts_at > now()
    and (coalesce(category_filter, '') = '' or e.category = category_filter)
    and (time_filter <> 'today' or timezone('Europe/Bucharest', e.starts_at)::date = b.today)
    and (time_filter <> 'weekend' or timezone('Europe/Bucharest', e.starts_at)::date between b.saturday and b.saturday + 1)
    and (e.organizer_id is null or public.can_view_profile(e.organizer_id))
  order by e.starts_at asc, e.id
  limit least(greatest(result_limit, 1), 40) offset greatest(result_offset, 0);
$$;

alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.event_interests enable row level security;
create policy "places_read_active" on public.places for select to authenticated using (active or public.has_role('moderator') or public.has_role('admin'));
create policy "places_admin_manage" on public.places for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "events_read_available" on public.events for select to authenticated using (organizer_id is null or public.can_view_profile(organizer_id));
create policy "outings_create_self" on public.events for insert to authenticated with check (organizer_id = auth.uid() and kind = 'outing');
create policy "outings_update_self" on public.events for update to authenticated using (organizer_id = auth.uid() and kind = 'outing') with check (organizer_id = auth.uid() and kind = 'outing');
create policy "outings_delete_self" on public.events for delete to authenticated using (organizer_id = auth.uid() and kind = 'outing');
create policy "events_staff_manage" on public.events for all to authenticated using (public.has_role('moderator') or public.has_role('admin')) with check (public.has_role('moderator') or public.has_role('admin'));
create policy "event_interests_read_visible" on public.event_interests for select to authenticated using (exists(select 1 from public.events e where e.id = event_id and (e.organizer_id is null or public.can_view_profile(e.organizer_id))));
create policy "event_interests_create_self" on public.event_interests for insert to authenticated with check (user_id = auth.uid() and exists(select 1 from public.events e where e.id = event_id and e.status = 'active' and e.starts_at > now()));
create policy "event_interests_delete_self" on public.event_interests for delete to authenticated using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', false, 2097152, array['image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "event_media_read" on storage.objects for select to authenticated using (
  bucket_id = 'event-media' and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  then public.can_view_profile(((storage.foldername(name))[1])::uuid) else false end
);
create policy "event_media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'event-media' and owner_id = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text);
create policy "event_media_delete" on storage.objects for delete to authenticated using (bucket_id = 'event-media' and owner_id = auth.uid()::text);
