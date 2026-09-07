import { EventComposer } from "@/components/event-composer";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Propune o ieșire" };
export default async function CreateEventPage() { const supabase = await createClient(); const { data: places } = await supabase.from("places").select("id, name, public_address").eq("active", true).order("name"); return <><p className="text-sm font-semibold text-violet-300">Adună oamenii potriviți</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Propune o ieșire</h1><p className="mt-3 text-sm leading-6 text-[#aaa4b8]">Publică doar adrese potrivite pentru a fi văzute de comunitate. Nu folosi adresa locuinței.</p><div className="mt-7"><EventComposer places={places ?? []} /></div></>; }
