import Link from "next/link";
import { requestConversation } from "@/app/actions/messaging";
import { FormMessage } from "@/components/form-message";
import { EmojiTextField } from "@/components/emoji-text-field";
import { createClient } from "@/lib/supabase/server";

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ username?: string; eroare?: string }> }) {
  const params = await searchParams;
  if (!params.username) {
    return <><p className="text-sm font-semibold text-violet-300">Conversație nouă</p><h1 className="mt-1 text-3xl font-black">Caută destinatarul</h1><form className="card mt-7 flex gap-3 p-6"><input className="field" name="username" required placeholder="Username fără @" /><button className="button-primary">Continuă</button></form><Link className="mt-5 inline-block text-sm text-violet-300" href="/descopera">Sau descoperă oameni după interese</Link></>;
  }
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name").eq("username", params.username).maybeSingle();
  if (!profile) return <><p className="text-sm font-semibold text-red-300">Destinatar negăsit</p><h1 className="mt-1 text-3xl font-black">Nu există acest username</h1><Link className="button-secondary mt-6" href="/mesaje/noi">Încearcă din nou</Link></>;
  return <><p className="text-sm font-semibold text-violet-300">Primul contact</p><h1 className="mt-1 text-3xl font-black">Mesaj pentru {profile.display_name}</h1><p className="mt-3 text-sm leading-6 text-[#aaa4b8]">Mesajul va fi trimis ca cerere. Destinatarul poate accepta, refuza sau bloca.</p><section className="card mt-7 p-6"><FormMessage error={params.eroare} /><form action={requestConversation}><input type="hidden" name="recipient_id" value={profile.id} /><input type="hidden" name="username" value={profile.username} /><EmojiTextField name="mesaj" multiline className="field min-h-40 pr-12" maxLength={4000} required placeholder="Scrie un mesaj respectuos și spune de ce ai vrea să vorbiți." /><button className="button-primary mt-5" type="submit">Trimite cererea</button></form></section></>;
}
