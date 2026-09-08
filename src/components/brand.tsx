import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="inline-flex items-center gap-2.5" href="/" aria-label="PitVibe.ro, pagina principală">
      <span className="grid h-9 w-9 rotate-[-7deg] place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-black shadow-lg shadow-violet-900/30">P</span>
      {!compact && <span className="text-xl font-black tracking-[-0.04em]">Pit<span className="text-violet-400">Vibe.ro</span></span>}
    </Link>
  );
}
