"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

async function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Videoclipul nu poate fi citit.")); };
    video.src = url;
  });
}

export function StoryComposer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function choose(selected?: File) {
    setError("");
    if (!selected) return;
    if (selected.size > 25 * 1024 * 1024 || (!selected.type.startsWith("image/") && !selected.type.startsWith("video/"))) return setError("Alege o fotografie sau un videoclip de maximum 25 MB.");
    if (selected.type.startsWith("video/")) {
      try { if (await videoDuration(selected) > 60) return setError("Videoclipul poate avea maximum 60 de secunde."); }
      catch (reason) { return setError(reason instanceof Error ? reason.message : "Videoclipul nu poate fi citit."); }
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function publish() {
    if (!file) return setError("Alege mai întâi o fotografie sau un videoclip.");
    setBusy(true); setError("");
    const form = new FormData(); form.set("media", file);
    try {
      const response = await fetch("/api/stories", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.replace("/acasa"); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Story-ul nu a putut fi publicat."); setBusy(false);
    }
  }

  return <div className="mx-auto max-w-md">
    <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => choose(event.target.files?.[0])} />
    <div className="relative grid aspect-[9/16] w-full place-items-center overflow-hidden rounded-[2rem] border border-dashed border-violet-400/35 bg-white/[.035] text-center">
      {preview ? file?.type.startsWith("video/") ? <video src={preview} className="h-full w-full object-contain" controls playsInline /> : <img src={preview} alt="Previzualizarea story-ului" className="h-full w-full object-contain" /> : <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 px-8"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-600 text-4xl font-light">+</span><strong className="mt-5 block text-lg">Adaugă foto sau video</strong><span className="mt-2 block text-sm leading-6 text-[#918a9e]">Videoclipurile pot avea maximum 60 de secunde.</span></button>}
      {preview && <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-4 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">Schimbă</button>}
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
    <div className="mt-5 flex gap-3"><button type="button" onClick={() => router.back()} className="button-secondary flex-1">Anulează</button><button type="button" onClick={publish} disabled={!file || busy} className="button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Se publică…" : "Publică story"}</button></div>
    <p className="mt-4 text-center text-xs text-[#827b8e]">Story-ul dispare automat după 24 de ore.</p>
  </div>;
}
