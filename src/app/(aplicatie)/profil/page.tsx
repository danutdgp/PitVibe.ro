import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function OwnProfilePage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); const { data: profile } = await supabase.from("profiles").select("username").eq("id", user!.id).single(); if (!profile) redirect("/bun-venit"); redirect(`/profil/${profile.username}`); }
