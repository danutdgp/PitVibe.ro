import { updateArea } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/server";

export async function AreaSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: areas }, { data: selected }] = await Promise.all([
    supabase.from("local_areas").select("id, name, kind").eq("active", true).order("sort_order"),
    supabase.from("profile_areas").select("area_id, visible").eq("user_id", user.id).maybeSingle(),
  ]);
  const neighborhoods = areas?.filter((area) => area.kind === "neighborhood") ?? [];
  const nearby = areas?.filter((area) => area.kind === "nearby") ?? [];
  return <section className="card mt-5 p-6"><h2 className="text-lg font-bold">Cartier sau zonă apropiată</h2><p className="mt-2 text-sm text-[#918a9e]">Alegerea rămâne privată dacă nu activezi afișarea.</p><form action={updateArea} className="mt-5 space-y-4"><select className="field" name="zona" defaultValue={selected?.area_id ?? ""}><option value="">Prefer să nu spun</option><optgroup label="Cartiere din Pitești">{neighborhoods.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</optgroup><optgroup label="Localități apropiate">{nearby.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</optgroup></select><label className="flex items-center gap-3 text-sm"><input className="accent-violet-500" type="checkbox" name="arata_zona" defaultChecked={selected?.visible ?? false} />Afișează zona pe profilul meu</label><button className="button-primary" type="submit">Salvează zona</button></form></section>;
}
