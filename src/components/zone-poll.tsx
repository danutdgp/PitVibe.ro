import { checkInZone, leaveZone } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/server";

type Response = "here" | "going" | "maybe";
type ZoneActivity = { id: number; slug: string; name: string; description: string; here_count: number; going_count: number; maybe_count: number; selected_response: Response | null };
const choices: { value: Response; label: string; count: keyof ZoneActivity }[] = [
  { value: "here", label: "Sunt aici", count: "here_count" },
  { value: "going", label: "Urmează", count: "going_count" },
  { value: "maybe", label: "Poate", count: "maybe_count" },
];

export async function ZonePoll() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_zone_activity");
  const zones = (data ?? []) as ZoneActivity[];
  if (!zones.length) return null;

  return <div className="mt-7 grid gap-5 sm:grid-cols-2">{zones.map((zone) => <section className="card p-5" key={zone.id}>
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">{zone.name}</h2><p className="mt-1 text-xs text-[#827b8e]">{zone.description}</p></div>{zone.selected_response && <form action={leaveZone}><input type="hidden" name="zone_id" value={zone.id} /><button className="text-xs font-semibold text-[#918a9e] hover:text-white">Anulează</button></form>}</div>
    <div className="mt-5 space-y-2">{choices.map((choice) => <form action={checkInZone} key={choice.value}><input type="hidden" name="zone_id" value={zone.id} /><input type="hidden" name="response" value={choice.value} /><button className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${zone.selected_response === choice.value ? "border-violet-400 bg-violet-500/15 text-violet-100" : "border-white/8 bg-white/[.025] text-[#c5bece] hover:border-violet-400/35 hover:bg-white/[.05]"}`}><span>{choice.label}</span><span className="rounded-full bg-black/20 px-2.5 py-1 text-xs">{Number(zone[choice.count])}</span></button></form>)}</div>
  </section>)}</div>;
}
