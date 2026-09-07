import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });

  const { data: story } = await supabase.from("stories").select("media_path, author_id").eq("id", id).maybeSingle();
  if (!story || story.author_id !== user.id) return NextResponse.json({ error: "Story-ul nu a fost găsit." }, { status: 404 });
  const { error } = await supabase.from("stories").delete().eq("id", id).eq("author_id", user.id);
  if (error) return NextResponse.json({ error: "Story-ul nu a putut fi șters." }, { status: 500 });
  await supabase.storage.from("story-media").remove([story.media_path]);
  return new NextResponse(null, { status: 204 });
}
