import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "./brand";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <Brand />
          <div className="mt-12"><h1 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">{title}</h1><p className="mt-3 leading-7 text-[#aaa4b8]">{subtitle}</p></div>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-center text-sm text-[#aaa4b8]">{footer}</div>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden border-l border-white/8 bg-[#100d18] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(139,92,246,.32),transparent_38%),radial-gradient(circle_at_75%_70%,rgba(217,70,239,.16),transparent_30%)]" />
        <div className="relative flex h-full flex-col justify-between p-14"><Link href="/" className="text-sm text-white/60">← Înapoi la prezentare</Link><blockquote className="max-w-xl text-4xl font-bold leading-tight tracking-[-.04em]">„Locul în care Piteștiul nu e doar pe hartă. E în conversație.”</blockquote><p className="text-sm text-white/45">O comunitate locală. Conexiuni reale.</p></div>
      </aside>
    </main>
  );
}
