alter table public.stories add column storage_bytes bigint not null default 0 check (storage_bytes between 0 and 26214400);

drop policy "stories_read_visible" on public.stories;
create policy "stories_read_visible" on public.stories for select to authenticated using (
  author_id = auth.uid() or (expires_at > now() and public.can_view_private_content(author_id))
);

drop policy "story_media_read" on storage.objects;
create policy "story_media_read" on storage.objects for select to authenticated using (
  bucket_id = 'story-media' and exists(
    select 1 from public.stories s
    where s.media_path = name and (s.author_id = auth.uid() or (s.expires_at > now() and public.can_view_private_content(s.author_id)))
  )
);

create index stories_archive_idx on public.stories(author_id, expires_at desc, created_at desc);