import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const { data: story } = await supabase.from("stories").select("author_id").eq("id", id).maybeSingle();
  if (!story || story.author_id !== user.id) return NextResponse.json({ error: "Vizualizările nu sunt disponibile." }, { status: 403 });
  const { data, error } = await supabase.from("story_views").select("viewer_id, viewed_at, profiles!story_views_viewer_id_fkey(username, display_name)").eq("story_id", id).neq("viewer_id", user.id).order("viewed_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Vizualizările nu au putut fi încărcate." }, { status: 500 });
  return NextResponse.json({ viewers: (data ?? []).map((view) => { const profile = Array.isArray(view.profiles) ? view.profiles[0] : view.profiles; return { id: view.viewer_id, username: profile?.username, displayName: profile?.display_name, viewedAt: view.viewed_at }; }).filter((viewer) => viewer.username) });
}