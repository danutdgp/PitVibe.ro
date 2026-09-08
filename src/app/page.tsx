import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

const highlights = [
  { number: "01", title: "Povești locale", text: "Vezi ce se întâmplă în comunitatea ta, fără zgomotul unui feed global." },
  { number: "02", title: "Oameni pe vibe-ul tău", text: "Descoperă oameni din Pitești prin interese comune și alegeri explicite." },
  { number: "03", title: "Ieșim?", text: "Propune o cafea, o plimbare sau găsește următorul eveniment local." },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/acasa");

  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Brand />
        <Link className="button-secondary min-h-11 px-5 text-sm" href="/autentificare">Intră în cont</Link>
      </nav>
      <section className="relative mx-auto grid min-h-[70vh] w-full max-w-6xl items-center gap-14 px-5 py-16 md:grid-cols-[1.15fr_.85fr] md:px-8 md:py-24">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_#a78bfa]" /> Comunitatea oamenilor din Pitești
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-7xl">Orașul tău are un <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">vibe.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#b9b3c5]">Descoperă oameni, povești și ieșiri din Pitești. O comunitate locală construită pentru conexiuni reale.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary" href="/inregistrare">Creează cont gratuit</Link>
            <a className="button-secondary" href="#descopera">Descoperă PitVibe.ro</a>
          </div>
          <p className="mt-4 text-xs text-[#888190]">Acces 13+ · Orașul și identitatea sunt declarate, nu verificate.</p>
        </div>
        <div aria-hidden="true" className="relative mx-auto h-[410px] w-full max-w-sm">
          <div className="absolute inset-8 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="card absolute left-0 top-12 w-[82%] rotate-[-7deg] p-5 shadow-2xl shadow-black/40">
            <div className="h-44 rounded-2xl bg-gradient-to-br from-[#f59e8b] via-[#8247a8] to-[#251d49]" />
            <div className="mt-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500 font-bold">A</div><div><p className="font-semibold">Apus în Trivale</p><p className="text-xs text-[#918a9e]">acum 12 minute</p></div></div>
          </div>
          <div className="glass absolute bottom-8 right-0 w-[78%] rotate-[5deg] rounded-[1.5rem] p-5 shadow-2xl shadow-black/50">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">Ieșim?</p><p className="mt-3 text-xl font-bold">Cafea & povești</p><p className="mt-2 text-sm text-[#aaa4b8]">Sâmbătă · 17:00 · Centru</p><div className="mt-5 rounded-full bg-white/8 px-4 py-2 text-center text-sm font-semibold">Mă interesează</div>
          </div>
        </div>
      </section>
      <section id="descopera" className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">{highlights.map((item) => <article className="card p-6" key={item.number}><span className="text-sm font-bold text-violet-400">{item.number}</span><h2 className="mt-8 text-xl font-bold">{item.title}</h2><p className="mt-3 leading-7 text-[#aaa4b8]">{item.text}</p></article>)}</div>
      </section>
    </main>
  );
}
