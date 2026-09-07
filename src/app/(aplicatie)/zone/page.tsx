import { ZonePoll } from "@/components/zone-poll";

export const metadata = { title: "Zone" };

export default function ZonesPage() {
  return <><p className="text-sm font-semibold text-violet-300">Vibe prin Pitești</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Unde se strânge lumea?</h1><p className="mt-3 max-w-2xl leading-7 text-[#aaa4b8]">Votează pentru fiecare zonă dacă ești deja acolo, urmează să ajungi sau doar te gândești. Răspunsurile sunt anonime și expiră automat.</p><ZonePoll /><p className="mt-5 text-xs leading-5 text-[#716b7d]">„Sunt aici” expiră după 2 ore, „Urmează” după 6 ore, iar „Poate” după 12 ore. Locația este declarată, nu verificată prin GPS.</p></>;
}
