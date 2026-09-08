import Link from "next/link";
import { createMissedConnection } from "@/app/actions/missed-connections";
import { createClient } from "@/lib/supabase/server";
import { EmojiTextField } from "@/components/emoji-text-field";

export const metadata = { title: "Întâlniri ratate" };

const vehicleMakes = [
  "BMW", "Audi", "Mercedes-Benz", "Volkswagen", "Dacia", "Toyota", "Ford", "Opel", "Renault", "Skoda",
  "Abarth", "Alfa Romeo", "Aston Martin", "Bentley", "BYD", "Cadillac", "Chevrolet", "Citroen", "Cupra", "Daihatsu", "Daewoo", "Dodge", "DS", "Ferrari", "Fiat", "Genesis", "Honda", "Hyundai", "Infiniti", "Isuzu", "Iveco", "Jaguar", "Jeep", "Kia", "Lada", "Lamborghini", "Lancia", "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "MG", "Mini", "Mitsubishi", "Nissan", "Peugeot", "Porsche", "Ram", "Rover", "Saab", "Seat", "Seres", "Smart", "Subaru", "Suzuki", "Tesla", "Volvo"
];

type MissedConnection = {
  id: string;
  description: string;
  vehicle_make: string;
  license_plate: string;
  created_at: string;
  profiles: { username: string; display_name: string } | { username: string; display_name: string }[] | null;
};

function profileOf(profile: MissedConnection["profiles"]) {
  return Array.isArray(profile) ? profile[0] : profile;
}

export default async function MissedConnectionsPage({ searchParams }: { searchParams: Promise<{ eroare?: string; publicat?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: posts, error } = await supabase.from("missed_connections").select("id, description, vehicle_make, license_plate, created_at, profiles!missed_connections_author_id_fkey(username, display_name)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(40);
  if (error) throw error;

  return <>
    <div>
      <p className="text-sm font-semibold text-violet-300">O secțiune separată de feed</p>
      <h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Întâlniri ratate</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#aaa4b8]">Ai văzut pe cineva și nu ai apucat să vorbești? Lasă un anunț, iar persoana se poate recunoaște și îți poate răspunde.</p>
    </div>

    <section className="card mt-7 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Publică un anunț</h2><p className="mt-1 text-sm text-[#aaa4b8]">Completează detaliile întâlnirii și ale mașinii.</p></div><span aria-hidden className="text-2xl">⌖</span></div>
      {params.eroare && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{params.eroare}</p>}
      {params.publicat && <p role="status" className="mt-4 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Anunțul a fost publicat.</p>}
      <form action={createMissedConnection} className="mt-5 grid gap-4">
        <label><span className="text-sm font-semibold">Descriere</span><EmojiTextField name="description" multiline className="field mt-2 min-h-28 resize-y pr-12" maxLength={2000} required placeholder="Caut fata de aseara" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold">Marca mașinii</span><select className="field mt-2" name="vehicle_make" defaultValue="" required><option value="" disabled>Alege marca</option>{vehicleMakes.map((make) => <option key={make} value={make}>{make}</option>)}</select></label><label><span className="text-sm font-semibold">Nr. înmatriculare</span><input className="field mt-2 uppercase" name="license_plate" maxLength={8} required placeholder="AG00YYY" /></label></div>
        <button className="button-primary w-full sm:w-auto sm:justify-self-start" type="submit">Publică anunțul</button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[#827b8e]">Folosește secțiunea doar pentru întâlniri reale și respectă răspunsul sau lipsa răspunsului celeilalte persoane.</p>
    </section>

    <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-violet-300">Comunitatea PitVibe</p><h2 className="mt-1 text-2xl font-black">Anunțuri recente</h2></div><span className="text-sm text-[#827b8e]">{posts?.length ?? 0} afișate</span></div>
      {posts?.length ? <div className="mt-5 space-y-4">{(posts as MissedConnection[]).map((post) => { const profile = profileOf(post.profiles); return <article className="card p-5" key={post.id}><div className="flex items-start justify-between gap-4"><div><Link href={`/profil/${profile?.username ?? "profil"}`} className="font-bold hover:text-violet-300">{profile?.display_name ?? "Membru PitVibe"}</Link><p className="mt-1 text-xs text-[#827b8e]">{new Date(post.created_at).toLocaleDateString("ro-RO")}</p></div><span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-200">Întâlnire ratată</span></div><p className="mt-4 whitespace-pre-wrap leading-7 text-[#e9e5f2]">{post.description}</p><dl className="mt-5 grid gap-3 border-t border-white/8 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-[#827b8e]">Marca mașinii</dt><dd className="mt-1 font-semibold">{post.vehicle_make}</dd></div><div><dt className="text-[#827b8e]">Nr. înmatriculare</dt><dd className="mt-1 font-semibold tracking-wide">{post.license_plate}</dd></div></dl>{profile?.username && <Link className="button-secondary mt-5 w-full sm:w-auto" href={`/mesaje/noi?username=${encodeURIComponent(profile.username)}`}>Trimite un mesaj</Link>}</article>; })}</div> : <div className="card mt-5 px-6 py-12 text-center"><h2 className="text-xl font-bold">Încă nu există anunțuri</h2><p className="mt-2 text-[#aaa4b8]">Fii primul care publică o întâlnire ratată.</p></div>}
    </section>
  </>;
}