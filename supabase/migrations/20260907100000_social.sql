-- Etapa 2: profiluri sociale, postări și interacțiuni.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_content_length check (char_length(content) <= 3000)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null unique,
  position smallint not null check (position between 0 and 3),
  width integer not null check (width between 1 and 4096),
  height integer not null check (height between 1 and 4096),
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index posts_feed_idx on public.posts(created_at desc, id desc);
create index posts_author_idx on public.posts(author_id, created_at desc);
create index post_media_post_idx on public.post_media(post_id, position);
create index post_likes_user_idx on public.post_likes(user_id, created_at desc);
create index comments_post_idx on public.comments(post_id, created_at asc);
create index saved_posts_user_idx on public.saved_posts(user_id, created_at desc);

create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger comments_set_updated_at before update on public.comments for each row execute function public.set_updated_at();

create or replace function public.can_view_private_content(target_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target_user = auth.uid() or (
    public.can_view_profile(target_user) and exists (
      select 1 from public.profiles p where p.id = target_user and (
        p.visibility = 'public' or exists (
          select 1 from public.follows f where f.follower_id = auth.uid() and f.followed_id = target_user and f.status = 'accepted'
        )
      )
    )
  );
$$;

create or replace function public.can_view_post(target_post uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.posts where id = target_post and public.can_view_private_content(author_id));
$$;

create or replace function public.follower_count(target_user uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select case when public.can_view_profile(target_user) then
    (select count(*) from public.follows where followed_id = target_user and status = 'accepted') else 0 end;
$$;

create or replace function public.following_count(target_user uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select case when public.can_view_profile(target_user) then
    (select count(*) from public.follows where follower_id = target_user and status = 'accepted') else 0 end;
$$;

create or replace function public.prepare_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target_visibility public.profile_visibility;
begin
  if public.users_are_blocked(new.follower_id, new.followed_id) then raise exception 'Interacțiunea nu este permisă'; end if;
  select visibility into target_visibility from public.profiles where id = new.followed_id and suspended_at is null;
  if target_visibility is null then raise exception 'Profil indisponibil'; end if;
  if target_visibility = 'public' then new.status = 'accepted'; new.accepted_at = now();
  else new.status = 'pending'; new.accepted_at = null; end if;
  return new;
end;
$$;
create trigger follows_prepare before insert on public.follows for each row execute function public.prepare_follow();

create or replace function public.cleanup_relationships_on_block() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.follows where (follower_id = new.blocker_id and followed_id = new.blocked_id) or (follower_id = new.blocked_id and followed_id = new.blocker_id);
  return new;
end;
$$;
create trigger blocks_cleanup_relationships after insert on public.blocks for each row execute function public.cleanup_relationships_on_block();

create or replace function public.limit_profile_interests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.profile_interests where user_id = new.user_id) >= 10 then raise exception 'Poți selecta maximum 10 interese'; end if;
  return new;
end;
$$;
create trigger profile_interests_limit before insert on public.profile_interests for each row execute function public.limit_profile_interests();

alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;

create policy "posts_read_visible" on public.posts for select to authenticated using (public.can_view_private_content(author_id));
-- API-ul validează că există text sau cel puțin o imagine înainte de creare.
create policy "posts_create_self" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "posts_update_self" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts_delete_self" on public.posts for delete to authenticated using (author_id = auth.uid());
create policy "post_media_read_visible" on public.post_media for select to authenticated using (public.can_view_post(post_id));
create policy "post_media_create_owner" on public.post_media for insert to authenticated with check (exists(select 1 from public.posts where id = post_id and author_id = auth.uid()));
create policy "post_media_delete_owner" on public.post_media for delete to authenticated using (exists(select 1 from public.posts where id = post_id and author_id = auth.uid()));
create policy "likes_read_visible" on public.post_likes for select to authenticated using (public.can_view_post(post_id));
create policy "likes_create_self" on public.post_likes for insert to authenticated with check (user_id = auth.uid() and public.can_view_post(post_id));
create policy "likes_delete_self" on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy "comments_read_visible" on public.comments for select to authenticated using (public.can_view_post(post_id));
create policy "comments_create_self" on public.comments for insert to authenticated with check (author_id = auth.uid() and public.can_view_post(post_id));
create policy "comments_update_self" on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "comments_delete_self" on public.comments for delete to authenticated using (author_id = auth.uid());
create policy "saves_private" on public.saved_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_view_post(post_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "post_media_file_read" on storage.objects for select to authenticated using (
  bucket_id = 'post-media' and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  then public.can_view_profile(((storage.foldername(name))[1])::uuid) else false end
);
create policy "post_media_file_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'post-media' and owner_id = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "post_media_file_delete" on storage.objects for delete to authenticated using (bucket_id = 'post-media' and owner_id = auth.uid()::text);

drop policy if exists "avatar_owner_read" on storage.objects;
create policy "avatar_visible_by_profile" on storage.objects for select to authenticated using (
  bucket_id = 'avatars' and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  then public.can_view_profile(((storage.foldername(name))[1])::uuid) else false end
);
