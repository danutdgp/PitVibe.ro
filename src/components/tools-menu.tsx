import Link from "next/link";

export function ToolsMenu({ desktop = false }: { desktop?: boolean }) {
  return <details className="relative">
    <summary aria-label="Deschide uneltele" title="Unelte" className={`${desktop ? "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" : "grid h-10 w-10 place-items-center rounded-full text-xl leading-none"} cursor-pointer list-none border border-white/8 bg-white/[.035] transition hover:bg-white/[.08] [&::-webkit-details-marker]:hidden`}><span aria-hidden>☰</span>{desktop && <span>Unelte</span>}</summary>
    <div className={`${desktop ? "left-0 top-12" : "right-0 top-12"} absolute z-40 w-56 rounded-2xl border border-white/10 bg-[#171320] p-2 shadow-2xl shadow-black/40`}>
      <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[.08em] text-[#827b8e]">Unelte</p>
      <Link href="/conexiuni-ratate" className="block rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-white/[.07]">Întâlniri ratate<span className="mt-1 block text-xs font-normal text-[#827b8e]">Găsește o persoană întâlnită</span></Link>
       <Link href="/potriviri" className="block rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-white/[.07]">Potriviri<span className="mt-1 block text-xs font-normal text-[#827b8e]">Vezi conexiunile reciproce</span></Link>
      <Link href="/poveste/arhiva" className="block rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-white/[.07]">Arhiva stories<span className="mt-1 block text-xs font-normal text-[#827b8e]">Păstrează stories fără copii</span></Link>
    </div>
  </details>;
}
