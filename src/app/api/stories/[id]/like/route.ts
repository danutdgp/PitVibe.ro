import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const { error } = await supabase.from("story_likes").upsert({ story_id: id, user_id: user.id }, { onConflict: "story_id,user_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Aprecierea nu a putut fi salvată." }, { status: 400 });
  return NextResponse.json({ liked: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const { error } = await supabase.from("story_likes").delete().eq("story_id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Aprecierea nu a putut fi eliminată." }, { status: 400 });
  return NextResponse.json({ liked: false });
}