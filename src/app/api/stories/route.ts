import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const kinds = {
  jpeg: { mime: "image/jpeg", extension: "jpg", mediaType: "image" },
  png: { mime: "image/png", extension: "png", mediaType: "image" },
  webp: { mime: "image/webp", extension: "webp", mediaType: "image" },
  mp4: { mime: "video/mp4", extension: "mp4", mediaType: "video" },
  webm: { mime: "video/webm", extension: "webm", mediaType: "video" },
} as const;

function sniff(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return kinds.jpeg;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return kinds.png;
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return kinds.webp;
  if (String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") return kinds.mp4;
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return kinds.webm;
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("media");
  if (!(file instanceof File) || !file.size || file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Alege o fotografie sau un videoclip de maximum 25 MB." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind || kind.mime !== file.type) return NextResponse.json({ error: "Fișierul ales nu este valid sau formatul nu este acceptat." }, { status: 400 });

  const { data: archived } = await supabase.from("stories").select("storage_bytes").eq("author_id", user.id).lte("expires_at", new Date().toISOString());
  const archivedBytes = (archived ?? []).reduce((total, story) => total + Number(story.storage_bytes ?? 0), 0);
  if ((archived?.length ?? 0) >= 100 || archivedBytes + bytes.byteLength > 2 * 1024 * 1024 * 1024) return NextResponse.json({ error: "Arhiva ta este plină. Șterge stories vechi pentru a publica unul nou." }, { status: 400 });

  const storyId = crypto.randomUUID();
  const path = `${user.id}/${storyId}.${kind.extension}`;
  const { error: uploadError } = await supabase.storage.from("story-media").upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Fișierul nu a putut fi încărcat." }, { status: 500 });

  const { error } = await supabase.from("stories").insert({ id: storyId, author_id: user.id, media_path: path, media_type: kind.mediaType, storage_bytes: bytes.byteLength });
  if (error) {
    await supabase.storage.from("story-media").remove([path]);
    return NextResponse.json({ error: "Story-ul nu a putut fi publicat." }, { status: 500 });
  }
  return NextResponse.json({ id: storyId }, { status: 201 });
}
