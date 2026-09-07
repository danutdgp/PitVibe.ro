import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const { error } = await supabase.from("story_views").upsert({ story_id: id, viewer_id: user.id }, { onConflict: "story_id,viewer_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Vizualizarea nu a putut fi înregistrată." }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
