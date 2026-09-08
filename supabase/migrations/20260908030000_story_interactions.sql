-- Reacții și răspunsuri pentru stories.
create table public.story_likes (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

create table public.story_replies (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index story_likes_story_idx on public.story_likes(story_id, created_at desc);
create index story_replies_story_idx on public.story_replies(story_id, created_at desc);

alter table public.story_likes enable row level security;
alter table public.story_replies enable row level security;

create policy "story_likes_read_relevant" on public.story_likes for select to authenticated using (
  user_id = auth.uid() or exists(select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy "story_likes_create_self" on public.story_likes for insert to authenticated with check (
  user_id = auth.uid() and exists(select 1 from public.stories s where s.id = story_id and s.expires_at > now() and public.can_view_private_content(s.author_id))
);
create policy "story_likes_delete_self" on public.story_likes for delete to authenticated using (user_id = auth.uid());

create policy "story_replies_read_relevant" on public.story_replies for select to authenticated using (
  sender_id = auth.uid() or exists(select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy "story_replies_create_self" on public.story_replies for insert to authenticated with check (
  sender_id = auth.uid() and public.is_active_user() and exists(select 1 from public.stories s where s.id = story_id and s.expires_at > now() and public.can_view_private_content(s.author_id))
);