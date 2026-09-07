import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormMessage } from "@/components/form-message";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signIn } from "./actions";

export const metadata = { title: "Autentificare" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ eroare?: string; mesaj?: string }> }) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  return <AuthShell title="Bine ai revenit" subtitle="Intră în cont și vezi ce mai e nou prin oraș." footer={<>Nu ai cont? <Link className="font-semibold text-violet-300 hover:text-violet-200" href="/inregistrare">Înscrie-te</Link></>}>
    <FormMessage error={params.eroare ?? (!configured ? "Conectează proiectul Supabase în .env.local pentru a activa autentificarea." : undefined)} message={params.mesaj} />
    <form action={signIn} className="space-y-5"><fieldset className="contents" disabled={!configured}>
      <label className="block"><span className="mb-2 block text-sm font-semibold">E-mail</span><input className="field" name="email" type="email" autoComplete="email" required placeholder="nume@exemplu.ro" /></label>
      <label className="block"><span className="mb-2 flex justify-between text-sm font-semibold">Parolă <Link className="font-normal text-violet-300" href="/parola-uitata">Ai uitat parola?</Link></span><input className="field" name="parola" type="password" autoComplete="current-password" required /></label>
      <button className="button-primary w-full" type="submit">Intră în PitiVibe</button>
    </fieldset></form>
  </AuthShell>;
}
