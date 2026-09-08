alter table public.missed_connections add column expires_at timestamptz not null default (now() + interval '30 days');
update public.missed_connections set expires_at = created_at + interval '30 days' where expires_at > created_at + interval '30 days';
create index missed_connections_active_idx on public.missed_connections(expires_at, created_at desc);