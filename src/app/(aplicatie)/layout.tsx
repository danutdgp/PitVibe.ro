import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const { data: profile } = await supabase.from("profiles").select("display_name, username, avatar_path, onboarding_completed, suspended_at").eq("id", user.id).single();
  if (profile?.suspended_at) redirect("/cont-suspendat");
  if (profile && !profile.onboarding_completed) redirect("/bun-venit");
  const [{ count: notificationCount }, { data: roles }, { data: avatar }] = await Promise.all([supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null), supabase.from("user_roles").select("role").eq("user_id", user.id), profile?.avatar_path ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600) : Promise.resolve({ data: null })]);
  const isStaff = roles?.some(({ role }) => role === "moderator" || role === "admin") ?? false;
  return <AppShell displayName={profile?.display_name ?? "Membru PitVibe.ro"} username={profile?.username ?? "profil"} avatarUrl={avatar?.signedUrl ?? null} notificationCount={notificationCount ?? 0} isStaff={isStaff}>{children}</AppShell>;
}
