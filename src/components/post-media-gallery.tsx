"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import type { FeedPost } from "@/lib/posts";

export function PostMediaGallery({ media, authorName }: { media: FeedPost["media"]; authorName: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => current === null ? null : (current - 1 + media.length) % media.length);
      if (event.key === "ArrowRight") setActiveIndex((current) => current === null ? null : (current + 1) % media.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, media.length]);

  return <>
    <div className={`grid gap-0.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {media.map((item, index) => <button type="button" onClick={() => setActiveIndex(index)} key={item.id} className={`relative cursor-zoom-in overflow-hidden bg-white/5 ${media.length === 3 && index === 0 ? "row-span-2" : ""}`} aria-label={`Deschide fotografia ${index + 1}`}>
        <img src={item.url} alt={`Fotografia ${index + 1} din postarea lui ${authorName}`} className={`w-full object-cover transition-transform duration-200 hover:scale-[1.015] ${media.length === 1 ? "max-h-[650px]" : "aspect-square"}`} />
      </button>)}
    </div>

    {activeIndex !== null && <div role="dialog" aria-modal="true" aria-label={`Fotografia ${activeIndex + 1} din ${media.length}`} onClick={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8">
      <button type="button" onClick={() => setActiveIndex(null)} aria-label="Închide fotografia" className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">×</button>
      {media.length > 1 && <button type="button" onClick={() => setActiveIndex((activeIndex - 1 + media.length) % media.length)} aria-label="Fotografia anterioară" className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-black/55 text-3xl text-white hover:bg-white/15 sm:left-6">‹</button>}
      <img src={media[activeIndex].url} alt={`Fotografia ${activeIndex + 1} din postarea lui ${authorName}`} className="max-h-full max-w-full object-contain" />
      {media.length > 1 && <button type="button" onClick={() => setActiveIndex((activeIndex + 1) % media.length)} aria-label="Fotografia următoare" className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-black/55 text-3xl text-white hover:bg-white/15 sm:right-6">›</button>}
      {media.length > 1 && <span className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">{activeIndex + 1} / {media.length}</span>}
    </div>}
  </>;
}
