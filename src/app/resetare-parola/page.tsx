import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormMessage } from "@/components/form-message";
import { updatePassword } from "../autentificare/actions";

export const metadata = { title: "Parolă nouă" };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ eroare?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="Alege o parolă nouă" subtitle="Folosește minimum 8 caractere și nu reutiliza o parolă veche." footer={<Link className="font-semibold text-violet-300" href="/autentificare">Înapoi la autentificare</Link>}>
    <FormMessage error={params.eroare} /><form action={updatePassword} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold">Parolă nouă</span><input className="field" name="parola" type="password" autoComplete="new-password" minLength={8} required /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Confirmă parola</span><input className="field" name="confirmare_parola" type="password" autoComplete="new-password" minLength={8} required /></label><button className="button-primary w-full" type="submit">Salvează parola</button></form>
  </AuthShell>;
}
