import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const types: Record<string, { mime: string; extension: string }> = {
  jpeg: { mime: "image/jpeg", extension: "jpg" }, png: { mime: "image/png", extension: "png" }, webp: { mime: "image/webp", extension: "webp" },
};

function sniff(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return types.jpeg;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return types.png;
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return types.webp;
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const form = await request.formData(); const content = String(form.get("content") ?? "").trim(); const files = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if ((!content && !files.length) || content.length > 3000 || files.length > 4) return NextResponse.json({ error: "Adaugă text sau maximum patru fotografii." }, { status: 400 });
  const dimensions = form.getAll("dimensions").map((item) => String(item).split("x").map(Number));
  const postId = crypto.randomUUID(); const uploaded: { path: string; position: number; width: number; height: number }[] = [];
  for (let position = 0; position < files.length; position++) {
    const file = files[position]; if (file.size > 2 * 1024 * 1024) { if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((item) => item.path)); return NextResponse.json({ error: "Fiecare fotografie trebuie să aibă maximum 2 MB după comprimare." }, { status: 400 }); }
    const buffer = new Uint8Array(await file.arrayBuffer()); const kind = sniff(buffer); const [width, height] = dimensions[position] ?? [];
    if (!kind || kind.mime !== file.type || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) { if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((item) => item.path)); return NextResponse.json({ error: "Una dintre fotografii nu este validă." }, { status: 400 }); }
    const path = `${user.id}/${postId}/${position}.${kind.extension}`; const { error } = await supabase.storage.from("post-media").upload(path, buffer, { contentType: kind.mime, upsert: false });
    if (error) { if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((item) => item.path)); return NextResponse.json({ error: "Fotografiile nu au putut fi încărcate." }, { status: 500 }); }
    uploaded.push({ path, position, width, height });
  }
  const { error: postError } = await supabase.from("posts").insert({ id: postId, author_id: user.id, content });
  if (postError) { if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((item) => item.path)); return NextResponse.json({ error: "Postarea nu a putut fi creată." }, { status: 500 }); }
  if (uploaded.length) {
    const { error: mediaError } = await supabase.from("post_media").insert(uploaded.map((item) => ({ post_id: postId, storage_path: item.path, position: item.position, width: item.width, height: item.height })));
    if (mediaError) { await supabase.from("posts").delete().eq("id", postId); await supabase.storage.from("post-media").remove(uploaded.map((item) => item.path)); return NextResponse.json({ error: "Postarea nu a putut fi finalizată." }, { status: 500 }); }
  }
  return NextResponse.json({ id: postId }, { status: 201 });
}
