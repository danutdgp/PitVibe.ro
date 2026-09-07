import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormMessage } from "@/components/form-message";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signUp } from "../autentificare/actions";

export const metadata = { title: "Creează cont" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ eroare?: string }> }) {
  const params = await searchParams; const configured = isSupabaseConfigured();
  return <AuthShell title="Intră în comunitate" subtitle="Contul este gratuit. După înregistrare îți vei configura profilul." footer={<>Ai deja cont? <Link className="font-semibold text-violet-300" href="/autentificare">Autentifică-te</Link></>}>
    <FormMessage error={params.eroare ?? (!configured ? "Conectează proiectul Supabase în .env.local pentru a activa înregistrarea." : undefined)} />
    <form action={signUp} className="space-y-5"><fieldset className="contents" disabled={!configured}>
      <input className="hidden" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="block"><span className="mb-2 block text-sm font-semibold">E-mail</span><input className="field" name="email" type="email" autoComplete="email" required placeholder="nume@exemplu.ro" /></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold">Parolă</span><input className="field" name="parola" type="password" autoComplete="new-password" minLength={8} required /><span className="mt-2 block text-xs text-[#827b8e]">Minimum 8 caractere.</span></label>
      <label className="flex cursor-pointer gap-3 text-sm leading-6 text-[#b9b3c5]"><input className="mt-1 h-4 w-4 accent-violet-500" name="varsta_confirmata" type="checkbox" required /><span>Confirm că am cel puțin 13 ani și accept regulile comunității.</span></label>
      <button className="button-primary w-full" type="submit">Creează contul</button>
    </fieldset></form>
  </AuthShell>;
}
