drop policy "story_likes_read_relevant" on public.story_likes;
create policy "story_likes_read_visible" on public.story_likes for select to authenticated using (
  exists(select 1 from public.stories s where s.id = story_id and s.expires_at > now() and public.can_view_private_content(s.author_id))
);