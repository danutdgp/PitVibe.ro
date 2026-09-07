import Link from "next/link";

const links = [["/despre", "Despre"], ["/contact", "Contact"], ["/reguli", "Reguli"], ["/termeni", "Termeni"], ["/confidentialitate", "Confidențialitate"], ["/preferinte", "Cookie-uri"], ["/instaleaza", "Instalează"]];

export function SiteFooter() {
  return <footer className="border-t border-white/8 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 text-center md:pb-8"><nav aria-label="Informații" className="flex flex-wrap justify-center gap-x-5 gap-y-2">{links.map(([href, label]) => <Link href={href} className="text-xs text-[#827b8e] hover:text-violet-200" key={href}>{label}</Link>)}</nav><p className="mt-4 text-xs text-[#625c6d]">© {new Date().getFullYear()} PitiVibe · Comunitate locală 13+</p></footer>;
}
