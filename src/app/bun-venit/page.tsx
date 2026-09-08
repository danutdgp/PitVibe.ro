import { redirect } from "next/navigation";
import { completeProfile, signOut } from "../autentificare/actions";
import { Brand } from "@/components/brand";
import { FormMessage } from "@/components/form-message";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Configurează profilul" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ eroare?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const [{ data: profile }, { data: areas }] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single(),
    supabase.from("local_areas").select("id, name, kind").eq("active", true).order("sort_order"),
  ]);
  if (profile?.onboarding_completed) redirect("/acasa");
  const neighborhoods = areas?.filter((area) => area.kind === "neighborhood") ?? [];
  const nearby = areas?.filter((area) => area.kind === "nearby") ?? [];

  return <main className="mx-auto min-h-screen max-w-xl px-5 py-8 sm:py-14"><div className="flex items-center justify-between gap-4"><Brand /><form action={signOut}><button type="submit" className="text-sm font-semibold text-red-300">Ieși din acest cont</button></form></div><div className="mt-12"><span className="text-sm font-bold text-violet-300">Pasul 1 din 1</span><h1 className="mt-2 text-4xl font-black tracking-[-.045em]">Cum te prezentăm comunității?</h1><p className="mt-3 leading-7 text-[#aaa4b8]">Cerem doar datele necesare. Data nașterii rămâne privată, iar tu decizi dacă zona apare pe profil.</p></div><div className="card mt-8 p-5 sm:p-7"><FormMessage error={params.eroare} /><form action={completeProfile} className="space-y-5">
    <label className="block"><span className="mb-2 block text-sm font-semibold">Nume afișat</span><input className="field" name="nume" minLength={2} maxLength={50} required autoComplete="name" /></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold">Username unic</span><div className="relative"><span className="absolute left-3 top-3 text-[#777181]">@</span><input className="field pl-8" name="username" minLength={3} maxLength={24} pattern="[a-z0-9_]+" required autoCapitalize="none" /></div><span className="mt-2 block text-xs text-[#827b8e]">Litere mici, cifre și underscore.</span></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-semibold">Data nașterii <span className="font-normal text-[#827b8e]">(privată)</span></span><input className="field [color-scheme:dark]" name="data_nasterii" type="date" required /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Oraș declarat</span><input className="field" name="oras" defaultValue="Pitești" maxLength={60} required /></label></div>
    <fieldset className="rounded-2xl border border-white/8 p-4"><legend className="px-2 text-sm font-semibold">Cartier sau zonă apropiată</legend><select className="field mt-2" name="zona" defaultValue=""><option value="">Prefer să nu spun</option><optgroup label="Cartiere din Pitești">{neighborhoods.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</optgroup><optgroup label="Localități apropiate">{nearby.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</optgroup></select><label className="mt-4 flex items-center gap-3 text-sm"><input className="accent-violet-500" type="checkbox" name="arata_zona" />Afișează zona pe profilul meu</label><p className="mt-2 text-xs leading-5 text-[#827b8e]">Nu colectăm adresa sau poziția GPS.</p></fieldset>
    <fieldset><legend className="mb-2 text-sm font-semibold">Vizibilitatea profilului</legend><div className="grid gap-3 sm:grid-cols-2"><label className="cursor-pointer rounded-xl border border-white/10 p-4 has-[:checked]:border-violet-400 has-[:checked]:bg-violet-400/8"><input className="mr-2 accent-violet-500" type="radio" name="vizibilitate" value="public" defaultChecked /> Public</label><label className="cursor-pointer rounded-xl border border-white/10 p-4 has-[:checked]:border-violet-400 has-[:checked]:bg-violet-400/8"><input className="mr-2 accent-violet-500" type="radio" name="vizibilitate" value="private" /> Privat</label></div></fieldset>
    <button className="button-primary w-full" type="submit">Finalizează profilul</button>
  </form></div></main>;
}
