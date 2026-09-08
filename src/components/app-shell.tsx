import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/app/autentificare/actions";
import { Brand } from "./brand";
import { AppNav } from "./app-nav";
import { ToolsMenu } from "./tools-menu";

function LogoutIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><path d="m15 16 4-4-4-4" /><path d="M19 12H9" /></svg>;
}

export function AppShell({ children, displayName, username, avatarUrl, notificationCount = 0, isStaff = false }: { children: ReactNode; displayName: string; username: string; avatarUrl: string | null; notificationCount?: number; isStaff?: boolean }) {
  return <div className="mx-auto min-h-screen max-w-[1440px] md:grid md:grid-cols-[250px_minmax(0,1fr)]">
    <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-[250px] border-r border-white/8 bg-[#0b0911]/80 p-6 backdrop-blur-xl md:flex md:flex-col">
      <Brand />
      <AppNav avatarUrl={avatarUrl} displayName={displayName} notificationCount={notificationCount} />
      <div className="mt-3"><ToolsMenu desktop /></div>
      <div className="mt-auto">
        {isStaff && <Link className="mb-3 block rounded-xl bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-200" href="/admin">Panou administrare</Link>}
        <div className="rounded-2xl border border-white/8 bg-white/[.035] p-3">
          <p className="truncate text-sm font-semibold">{displayName}</p><p className="truncate text-xs text-[#827b8e]">@{username}</p>
          <form action={signOut} className="mt-3 border-t border-white/8 pt-3"><button type="submit" className="text-xs font-semibold text-red-300 transition hover:text-red-200">Deconectare</button></form>
        </div>
      </div>
    </aside>
    <div className="md:col-start-2">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/8 bg-[#0a0811]/85 px-5 backdrop-blur-xl md:hidden">
        <Brand compact />
        <div className="ml-auto flex gap-2">
          <ToolsMenu />
          <Link href="/mesaje" aria-label="Mesaje" title="Mesaje" className="grid h-10 w-10 place-items-center rounded-full border border-white/8 bg-white/[.035] hover:bg-white/[.07]">✉</Link>
          <Link href="/notificari" aria-label={`${notificationCount} notificări necitite`} className="relative grid h-10 w-10 place-items-center rounded-full border border-white/8 bg-white/[.035] hover:bg-white/[.07]">♢{notificationCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-fuchsia-500 px-1 text-center text-[10px] font-bold leading-5">{Math.min(notificationCount, 99)}</span>}</Link>
          <form action={signOut}><button type="submit" aria-label="Deconectare" title="Deconectare" className="grid h-10 w-10 place-items-center rounded-full border border-red-400/15 bg-red-400/[.05] text-red-300 hover:bg-red-400/10"><LogoutIcon /></button></form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>
    </div>
    <div className="md:hidden"><AppNav avatarUrl={avatarUrl} displayName={displayName} notificationCount={notificationCount} /></div>
  </div>;
}
