import Link from "next/link";
import { Brand } from "@/components/brand";

export default function OfflinePage() {
  return <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-5"><section className="card w-full p-8 text-center"><div className="flex justify-center"><Brand /></div><p className="mt-8 text-sm font-bold text-amber-300">Nu există conexiune</p><h1 className="mt-2 text-3xl font-black">PitVibe.ro este offline</h1><p className="mt-4 leading-7 text-[#aaa4b8]">Reconectează-te la internet pentru a vedea feedul, mesajele și informațiile actualizate. Nimic netrimis nu este prezentat ca publicat.</p><Link className="button-primary mt-7" href="/">Încearcă din nou</Link></section></main>;
}
