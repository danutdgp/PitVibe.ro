import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormMessage } from "@/components/form-message";
import { requestPasswordReset } from "../autentificare/actions";

export const metadata = { title: "Recuperează parola" };
export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ mesaj?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="Recuperează parola" subtitle="Îți trimitem un link securizat dacă adresa este asociată unui cont." footer={<Link className="font-semibold text-violet-300" href="/autentificare">← Înapoi la autentificare</Link>}>
    <FormMessage message={params.mesaj} /><form action={requestPasswordReset} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold">E-mail</span><input className="field" name="email" type="email" autoComplete="email" required /></label><button className="button-primary w-full" type="submit">Trimite instrucțiunile</button></form>
  </AuthShell>;
}
