import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const body = await request.json().catch(() => null) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 1000) return NextResponse.json({ error: "Răspunsul trebuie să aibă între 1 și 1000 de caractere." }, { status: 400 });
  const { error } = await supabase.from("story_replies").insert({ story_id: id, sender_id: user.id, content });
  if (error) return NextResponse.json({ error: "Răspunsul nu a putut fi trimis." }, { status: 400 });
  return NextResponse.json({ sent: true }, { status: 201 });
}