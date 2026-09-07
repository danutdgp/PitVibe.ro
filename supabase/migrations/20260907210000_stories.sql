-- Stories foto/video, vizibile timp de 24 de ore.
create type public.story_media_type as enum ('image', 'video');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_path text not null unique,
  media_type public.story_media_type not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint story_lifetime check (expires_at > created_at and expires_at <= created_at + interval '24 hours 5 minutes')
);

create table public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create index stories_active_idx on public.stories(expires_at desc, created_at desc);
create index stories_author_idx on public.stories(author_id, created_at desc);
create index story_views_story_idx on public.story_views(story_id, viewed_at desc);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

create policy "stories_read_visible" on public.stories for select to authenticated using (
  expires_at > now() and public.can_view_private_content(author_id)
);
create policy "stories_create_self" on public.stories for insert to authenticated with check (
  author_id = auth.uid() and public.is_active_user()
);
create policy "stories_delete_self" on public.stories for delete to authenticated using (
  author_id = auth.uid()
);

create policy "story_views_read_relevant" on public.story_views for select to authenticated using (
  viewer_id = auth.uid() or exists(select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy "story_views_create_self" on public.story_views for insert to authenticated with check (
  viewer_id = auth.uid() and exists(select 1 from public.stories s where s.id = story_id and s.expires_at > now())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-media', 'story-media', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "story_media_read" on storage.objects for select to authenticated using (
  bucket_id = 'story-media' and exists(
    select 1 from public.stories s
    where s.media_path = name and s.expires_at > now() and public.can_view_private_content(s.author_id)
  )
);
create policy "story_media_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'story-media' and owner_id = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "story_media_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'story-media' and owner_id = auth.uid()::text
);
