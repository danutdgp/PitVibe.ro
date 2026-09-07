-- Transformă prezența simplă într-un poll separat pentru fiecare zonă.
create type public.zone_poll_response as enum ('here', 'going', 'maybe');

alter table public.zone_checkins drop constraint zone_checkins_pkey;
alter table public.zone_checkins add column response public.zone_poll_response not null default 'here';
alter table public.zone_checkins drop constraint zone_checkin_lifetime;
alter table public.zone_checkins add constraint zone_checkin_lifetime check (expires_at > checked_in_at and expires_at <= checked_in_at + interval '12 hours 5 minutes');
alter table public.zone_checkins add primary key (user_id, zone_id);

drop function public.list_zone_activity();
drop function public.check_in_zone(bigint);
drop function public.leave_zone();

create or replace function public.list_zone_activity()
returns table(id bigint, slug text, name text, description text, here_count bigint, going_count bigint, maybe_count bigint, selected_response public.zone_poll_response)
language sql stable security definer set search_path = '' as $$
  select z.id, z.slug, z.name, z.description,
    count(c.user_id) filter (where c.expires_at > now() and c.response = 'here') as here_count,
    count(c.user_id) filter (where c.expires_at > now() and c.response = 'going') as going_count,
    count(c.user_id) filter (where c.expires_at > now() and c.response = 'maybe') as maybe_count,
    (select mine.response from public.zone_checkins mine where mine.user_id = auth.uid() and mine.zone_id = z.id and mine.expires_at > now()) as selected_response
  from public.local_zones z
  left join public.zone_checkins c on c.zone_id = z.id
  where z.active and auth.uid() is not null
  group by z.id, z.slug, z.name, z.description, z.sort_order
  order by z.sort_order, z.name;
$$;

create or replace function public.check_in_zone(target_zone bigint, target_response public.zone_poll_response) returns void
language plpgsql security definer set search_path = '' as $$
declare lifetime interval;
begin
  if auth.uid() is null or not public.is_active_user() or not exists(select 1 from public.local_zones where id = target_zone and active) then
    raise exception 'Zona nu este disponibilă';
  end if;
  lifetime := case target_response when 'here' then interval '2 hours' when 'going' then interval '6 hours' else interval '12 hours' end;
  if target_response = 'here' then delete from public.zone_checkins where user_id = auth.uid() and response = 'here' and zone_id <> target_zone; end if;
  insert into public.zone_checkins(user_id, zone_id, response, checked_in_at, expires_at)
  values(auth.uid(), target_zone, target_response, now(), now() + lifetime)
  on conflict (user_id, zone_id) do update set response = excluded.response, checked_in_at = excluded.checked_in_at, expires_at = excluded.expires_at;
end;
$$;

create or replace function public.leave_zone(target_zone bigint) returns void
language sql security definer set search_path = '' as $$
  delete from public.zone_checkins where user_id = auth.uid() and zone_id = target_zone;
$$;

revoke all on function public.list_zone_activity() from public;
revoke all on function public.check_in_zone(bigint, public.zone_poll_response) from public;
revoke all on function public.leave_zone(bigint) from public;
grant execute on function public.list_zone_activity() to authenticated;
grant execute on function public.check_in_zone(bigint, public.zone_poll_response) to authenticated;
grant execute on function public.leave_zone(bigint) to authenticated;
