"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function withMessage(path: string, key: "eroare" | "mesaj", message: string) { redirect(`${path}?${key}=${encodeURIComponent(message)}`); }

export async function signIn(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "parola");
  if (!email || !password) withMessage("/autentificare", "eroare", "Completează e-mailul și parola.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) withMessage("/autentificare", "eroare", "Datele de autentificare nu sunt corecte sau e-mailul nu este confirmat.");
  const { data: { user } } = await supabase.auth.getUser();
  if (user) { const { data: profile } = await supabase.from("profiles").select("suspended_at").eq("id", user.id).single(); if (profile?.suspended_at) { await supabase.auth.signOut(); withMessage("/autentificare", "eroare", "Acest cont este suspendat. Folosește pagina de contact pentru clarificări."); } }
  redirect("/acasa");
}

export async function signUp(formData: FormData) {
  if (value(formData, "website")) redirect("/");
  const email = value(formData, "email");
  const password = value(formData, "parola");
  const confirmedAge = formData.get("varsta_confirmata") === "on";
  if (!confirmedAge) withMessage("/inregistrare", "eroare", "Trebuie să confirmi că ai cel puțin 13 ani.");
  if (password.length < 8) withMessage("/inregistrare", "eroare", "Parola trebuie să aibă cel puțin 8 caractere.");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/bun-venit` } });
  if (error) withMessage("/inregistrare", "eroare", "Contul nu a putut fi creat. Verifică datele sau încearcă mai târziu.");
  withMessage("/autentificare", "mesaj", "Ți-am trimis un e-mail de confirmare. Deschide linkul pentru a continua.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/resetare-parola` });
  withMessage("/parola-uitata", "mesaj", "Dacă adresa există, vei primi instrucțiunile de resetare.");
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, "parola");
  const confirmation = value(formData, "confirmare_parola");
  if (password.length < 8 || password !== confirmation) withMessage("/resetare-parola", "eroare", "Parolele trebuie să coincidă și să aibă cel puțin 8 caractere.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) withMessage("/resetare-parola", "eroare", "Linkul a expirat. Solicită unul nou.");
  withMessage("/autentificare", "mesaj", "Parola a fost schimbată. Te poți autentifica.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const displayName = value(formData, "nume");
  const username = value(formData, "username").toLowerCase();
  const birthDate = value(formData, "data_nasterii");
  const city = value(formData, "oras") || "Pitești";
  const visibility = value(formData, "vizibilitate") === "private" ? "private" : "public";
  const areaId = Number(value(formData, "zona"));
  const selectedArea = Number.isSafeInteger(areaId) && areaId > 0 ? areaId : null;
  const showArea = Boolean(selectedArea && formData.get("arata_zona") === "on");
  const threshold = new Date(); threshold.setFullYear(threshold.getFullYear() - 13);
  if (!/^[a-z0-9_]{3,24}$/.test(username)) withMessage("/bun-venit", "eroare", "Username-ul acceptă 3–24 de litere mici, cifre și _.");
  if (displayName.length < 2 || displayName.length > 50) withMessage("/bun-venit", "eroare", "Numele afișat trebuie să aibă între 2 și 50 de caractere.");
  if (!birthDate || new Date(`${birthDate}T00:00:00`) > threshold) withMessage("/bun-venit", "eroare", "PitiVibe este disponibil persoanelor care au împlinit 13 ani.");
  const { error: privateError } = await supabase.from("profile_private").upsert({ user_id: user.id, birth_date: birthDate });
  if (privateError) withMessage("/bun-venit", "eroare", "Data nașterii nu a putut fi salvată.");
  if (selectedArea) {
    const { error: areaError } = await supabase.from("profile_areas").upsert({ user_id: user.id, area_id: selectedArea, visible: showArea });
    if (areaError) withMessage("/bun-venit", "eroare", "Zona aleasă nu a putut fi salvată.");
  }
  const { error: profileError } = await supabase.from("profiles").update({ display_name: displayName, username, city, visibility, onboarding_completed: true }).eq("id", user.id);
  if (profileError) withMessage("/bun-venit", "eroare", profileError.code === "23505" ? "Acest username este deja folosit." : "Profilul nu a putut fi salvat.");
  redirect("/acasa");
}

export async function updatePrivacy(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const visibility = value(formData, "vizibilitate") === "private" ? "private" : "public";
  const { error } = await supabase.from("profiles").update({ visibility }).eq("id", user.id);
  if (error) withMessage("/setari", "eroare", "Preferința nu a putut fi salvată.");
  withMessage("/setari", "mesaj", "Preferința de confidențialitate a fost salvată.");
}

export async function deleteAccount(formData: FormData) {
  if (value(formData, "confirmare") !== "ȘTERGE") withMessage("/setari", "eroare", "Scrie exact ȘTERGE pentru confirmare.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const admin = createAdminClient();
  const [{ data: avatarFiles }, { data: postFiles }] = await Promise.all([
    admin.storage.from("avatars").list(user.id, { limit: 100 }),
    admin.from("post_media").select("storage_path, posts!inner(author_id)").eq("posts.author_id", user.id),
  ]);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) withMessage("/setari", "eroare", "Contul nu a putut fi șters. Încearcă din nou.");
  if (avatarFiles?.length) await admin.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
  if (postFiles?.length) await admin.storage.from("post-media").remove(postFiles.map((file) => file.storage_path));
  redirect("/?cont=sters");
}
