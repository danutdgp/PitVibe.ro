"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiTextField } from "@/components/emoji-text-field";

type PreparedImage = { file: File; preview: string; width: number; height: number };

async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) throw new Error("Alege imagini de maximum 15 MB.");
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height)); const width = Math.round(bitmap.width * scale); const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); if (!context) throw new Error("Imaginea nu a putut fi procesată.");
  context.drawImage(bitmap, 0, 0, width, height); bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82)); if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("Imaginea este prea mare chiar și după comprimare.");
  const output = new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" }); return { file: output, preview: URL.createObjectURL(output), width, height };
}

export function PostComposer() {
  const router = useRouter(); const inputRef = useRef<HTMLInputElement>(null); const [content, setContent] = useState(""); const [images, setImages] = useState<PreparedImage[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function choose(files: FileList | null) { if (!files) return; setError(""); const remaining = 4 - images.length; try { const prepared = await Promise.all(Array.from(files).slice(0, remaining).map(prepareImage)); setImages((current) => [...current, ...prepared]); } catch (reason) { setError(reason instanceof Error ? reason.message : "Fotografiile nu au putut fi procesate."); } if (inputRef.current) inputRef.current.value = ""; }
  function remove(index: number) { setImages((current) => { URL.revokeObjectURL(current[index].preview); return current.filter((_, itemIndex) => itemIndex !== index); }); }
  async function publish() { if (!content.trim() && !images.length) { setError("Scrie ceva sau adaugă o fotografie."); return; } if (!navigator.onLine) { setError("Ești offline. Postarea nu a fost trimisă."); return; } setBusy(true); setError(""); const form = new FormData(); form.set("content", content.trim()); images.forEach((image) => { form.append("images", image.file); form.append("dimensions", `${image.width}x${image.height}`); });
    try { const response = await fetch("/api/posts", { method: "POST", body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error); router.push(`/postare/${result.id}`); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Postarea nu a putut fi publicată."); setBusy(false); }
  }
  return <div className="card p-5 sm:p-7"><label htmlFor="post-content" className="text-sm font-semibold">Ce vrei să împărtășești?</label><EmojiTextField name="content" multiline className="field mt-3 min-h-40 resize-y pr-12" maxLength={3000} value={content} onValueChange={setContent} placeholder="Un loc nou, o fotografie, ceva ce merită știut..." /><div className="mt-2 text-right text-xs text-[#827b8e]">{content.length}/3000</div>{images.length > 0 && <div className={`mt-4 grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{images.map((image, index) => <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5" key={image.preview}><Image src={image.preview} alt={`Fotografie selectată ${index + 1}`} fill unoptimized className="object-cover" /><button type="button" onClick={() => remove(index)} aria-label={`Elimină fotografia ${index + 1}`} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-lg">×</button></div>)}</div>}{error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between"><div><input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => choose(event.target.files)} /><button className="button-secondary w-full sm:w-auto" type="button" disabled={images.length >= 4 || busy} onClick={() => inputRef.current?.click()}>▧ Adaugă fotografii ({images.length}/4)</button></div><button className="button-primary" type="button" disabled={busy} onClick={publish}>{busy ? "Se publică…" : "Publică"}</button></div><p className="mt-4 text-xs leading-5 text-[#827b8e]">Fotografiile sunt redimensionate și recodificate înainte de încărcare; metadatele de localizare nu sunt păstrate.</p></div>;
}
