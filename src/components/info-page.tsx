import Link from "next/link";
import { Brand } from "@/components/brand";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-3xl px-5 py-8 sm:py-12"><div className="flex items-center justify-between"><Brand /><Link href="/" className="text-sm font-semibold text-violet-300">Înapoi</Link></div><article className="mt-12"><p className="text-sm font-bold text-violet-300">{eyebrow}</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em]">{title}</h1><p className="mt-4 text-lg leading-8 text-[#b9b3c5]">{intro}</p><div className="prose-pitivibe mt-9 space-y-7 leading-7 text-[#c5bece]">{children}</div></article></main>;
}
