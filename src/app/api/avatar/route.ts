import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const form = await request.formData(); const file = form.get("avatar"); if (!(file instanceof File) || file.size < 12 || file.size > 1024 * 1024 || file.type !== "image/webp") return NextResponse.json({ error: "Fotografia nu este validă." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer()); if (String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" || String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") return NextResponse.json({ error: "Formatul fotografiei nu este valid." }, { status: 400 });
  const path = `${user.id}/avatar.webp`; const { error: uploadError } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: "image/webp", upsert: true }); if (uploadError) return NextResponse.json({ error: "Fotografia nu a putut fi încărcată." }, { status: 500 });
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id); if (error) return NextResponse.json({ error: "Profilul nu a putut fi actualizat." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
