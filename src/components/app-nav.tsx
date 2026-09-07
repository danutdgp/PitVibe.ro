"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/acasa", "⌂", "Acasă"], ["/descopera", "⌕", "Descoperă"], ["/publica", "+", "Publică"], ["/iesim", "✦", "Ieșim?"], ["/zone", "⌖", "Zone"], ["/mesaje", "✉", "Mesaje", "desktop"], ["/notificari", "♢", "Notificări", "desktop"], ["/profil", "○", "Profil"],
];

export function AppNav({ avatarUrl, displayName, notificationCount = 0 }: { avatarUrl: string | null; displayName: string; notificationCount?: number }) {
  const pathname = usePathname();
  return <nav aria-label="Navigare principală" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#0d0a13]/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:px-0 md:pt-8 md:backdrop-blur-none">
    <ul className="flex justify-around md:flex-col md:gap-2">{items.map(([href, icon, label, visibility]) => { const active = pathname === href || (href !== "/acasa" && pathname.startsWith(`${href}/`)); return <li key={href} className={`${visibility === "desktop" ? "hidden md:block" : ""} ${href === "/publica" ? "md:my-3" : ""}`}><Link href={href} aria-current={active ? "page" : undefined} className={`relative flex min-w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition md:min-w-16 md:flex-row md:gap-3 md:px-3 md:text-sm ${href === "/publica" ? "bg-violet-600 font-bold text-white md:justify-center" : active ? "bg-violet-400/12 font-semibold text-violet-300" : "text-[#8f899a] hover:bg-white/5 hover:text-white"}`}>{href === "/profil" ? <span aria-hidden className="h-6 w-6 overflow-hidden rounded-full border border-white/25 bg-gradient-to-br from-violet-500 to-fuchsia-500">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] font-bold text-white">{displayName[0]?.toUpperCase()}</span>}</span> : <span aria-hidden className="relative grid h-6 w-6 place-items-center text-xl leading-none">{icon}{href === "/notificari" && notificationCount > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-fuchsia-500 px-1 text-center text-[10px] font-bold leading-5 text-white">{Math.min(notificationCount, 99)}</span>}</span>}<span>{label}</span></Link></li>; })}</ul>
  </nav>;
}
