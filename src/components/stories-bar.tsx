"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryGroup } from "@/lib/stories";

export function StoriesBar({ groups: initialGroups, currentUserId }: { groups: StoryGroup[]; currentUserId: string }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [groupIndex, setGroupIndex] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const group = groupIndex === null ? null : groups[groupIndex];
  const story = group?.stories[storyIndex];
  const activeStoryId = story?.id;
  const activeAuthorId = group?.authorId;
  const activeMediaType = story?.mediaType;

  function close() { setGroupIndex(null); setStoryIndex(0); setProgress(0); }
  function next() {
    if (!group || groupIndex === null) return;
    setProgress(0);
    if (storyIndex < group.stories.length - 1) { setStoryIndex(storyIndex + 1); return; }
    if (groupIndex < groups.length - 1) { setGroupIndex(groupIndex + 1); setStoryIndex(0); return; }
    close();
  }
  function previous() {
    if (!group || groupIndex === null) return;
    setProgress(0);
    if (storyIndex > 0) { setStoryIndex(storyIndex - 1); return; }
    if (groupIndex > 0) { const previousGroup = groups[groupIndex - 1]; setGroupIndex(groupIndex - 1); setStoryIndex(previousGroup.stories.length - 1); }
  }

  useEffect(() => {
    if (!activeStoryId || !activeAuthorId || activeAuthorId === currentUserId) return;
    void fetch(`/api/stories/${activeStoryId}/view`, { method: "POST" });
  }, [activeStoryId, activeAuthorId, currentUserId]);

  useEffect(() => {
    if (!activeStoryId || activeMediaType === "video") return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - startedAt) / 5000) * 100)), 50);
    const timeout = window.setTimeout(next, 5000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
    // `next` intentionally follows the story currently displayed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId, activeMediaType]);

  useEffect(() => {
    if (!story) return;
    const oldOverflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowRight") next(); if (event.key === "ArrowLeft") previous(); };
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", keydown); };
    // Keyboard controls always act on the currently displayed story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId]);

  async function removeStory() {
    if (!story || !window.confirm("Ștergi definitiv acest story?")) return;
    const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setGroups((current) => current.map((item) => ({ ...item, stories: item.stories.filter((entry) => entry.id !== story.id) })).filter((item) => item.stories.length));
    close(); router.refresh();
  }

  return <>
    <section aria-label="Stories" className="mt-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-4 px-1">
        <Link href="/poveste" className="group flex w-[72px] flex-col items-center gap-2 text-center">
          <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[.055]"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-2xl font-light transition group-hover:scale-110">+</span></span>
          <span className="w-full truncate text-xs text-[#c5bece]">Story nou</span>
        </Link>
        {groups.map((item, index) => <button type="button" onClick={() => { setProgress(0); setGroupIndex(index); const unseen = item.stories.findIndex((entry) => !entry.viewed); setStoryIndex(unseen < 0 ? 0 : unseen); }} className="group flex w-[72px] flex-col items-center gap-2 text-center" key={item.authorId}>
          <span className={`rounded-full p-[2px] ${item.allViewed ? "bg-white/20" : "bg-gradient-to-tr from-fuchsia-500 via-violet-500 to-orange-300"}`}><span className="block h-[60px] w-[60px] overflow-hidden rounded-full border-[3px] border-[#0d0a13] bg-gradient-to-br from-violet-500 to-fuchsia-500">{item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-lg font-bold">{item.displayName[0]?.toUpperCase()}</span>}</span></span>
          <span className="w-full truncate text-xs text-[#c5bece]">{item.authorId === currentUserId ? "Story-ul tău" : item.displayName}</span>
        </button>)}
      </div>
    </section>

    {story && group && <div role="dialog" aria-modal="true" aria-label={`Story de la ${group.displayName}`} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 sm:p-5">
      <div className="relative h-full w-full overflow-hidden bg-black sm:h-[min(900px,95vh)] sm:max-w-lg sm:rounded-[2rem]">
        <div className="absolute inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-30 flex gap-1">{group.stories.map((item, index) => { const value = index < storyIndex ? 100 : index === storyIndex ? progress : 0; return <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30 shadow-sm" key={item.id}><span className="block h-full origin-left rounded-full bg-white will-change-transform" style={{ transform: `scaleX(${value / 100})` }} /></span>; })}</div>
        <div className="absolute inset-x-4 top-[calc(max(.75rem,env(safe-area-inset-top))+1rem)] z-20 flex items-center gap-3 text-white"><Link href={`/profil/${group.username}`} onClick={close} className="flex min-w-0 items-center gap-2"><span className="h-9 w-9 overflow-hidden rounded-full bg-violet-600">{group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold">{group.displayName[0]?.toUpperCase()}</span>}</span><span className="truncate text-sm font-bold">{group.displayName}</span></Link><span className="text-xs text-white/65">{new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(new Date(story.createdAt))}</span><button type="button" onClick={close} aria-label="Închide" className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/25 text-2xl">×</button></div>
        {story.mediaType === "video" ? <video key={story.id} src={story.mediaUrl} autoPlay playsInline className="h-full w-full object-contain" onTimeUpdate={(event) => { const video = event.currentTarget; if (video.duration) setProgress((video.currentTime / video.duration) * 100); }} onEnded={next} /> : <img src={story.mediaUrl} alt={`Story de la ${group.displayName}`} className="h-full w-full object-contain" />}
        <button type="button" onClick={previous} aria-label="Story anterior" className="absolute inset-y-20 left-0 w-1/3 cursor-w-resize" />
        <button type="button" onClick={next} aria-label="Story următor" className="absolute inset-y-20 right-0 w-1/3 cursor-e-resize" />
        {group.authorId === currentUserId && <div className="absolute inset-x-4 bottom-5 z-20 flex items-center justify-between"><Link href={`/poveste/${story.id}/vizualizari`} className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white">◉ {story.viewCount} vizualizări</Link><button type="button" onClick={removeStory} className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-red-200">Șterge</button></div>}
      </div>
    </div>}
  </>;
}
