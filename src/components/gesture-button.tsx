"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export function GestureButton({ action, recipientId, username, gesture, active }: { action: (data: FormData) => void; recipientId: string; username: string; gesture: "rose" | "spark"; active: boolean }) {
  const [thrown, setThrown] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const emoji = gesture === "rose" ? "🌹" : "⚡";
  const label = active ? "Retrage gestul" : gesture === "rose" ? "Aruncă un trandafir" : "Trimite o scânteie";
  const pending = useFormStatus().pending;
  return <form action={action} onSubmit={() => { setThrown(!active); setConfirming(false); }}><input type="hidden" name="recipient_id" value={recipientId} /><input type="hidden" name="username" value={username} /><span className="relative block"><button type="button" disabled={pending} onClick={() => setConfirming(true)} aria-label={label} title={label} className={`relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-xl transition hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${active ? "border-violet-300/50 bg-violet-400/15" : "border-white/10 bg-white/[.045]"} ${thrown ? "animate-bounce" : ""}`}>{emoji}{thrown && !active && <span aria-hidden className="pointer-events-none absolute -right-7 -top-5 text-sm opacity-0 [animation:gesture-fly_700ms_ease-out_forwards]">{emoji}</span>}</button>{confirming && <span className="absolute right-0 top-12 z-30 flex items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-[#171320] p-2 text-xs shadow-xl"><button type="submit" className="rounded-lg bg-violet-600 px-3 py-2 font-bold text-white">{active ? "Retragi?" : "Arunci?"}</button><button type="button" onClick={() => setConfirming(false)} className="rounded-lg bg-white/[.08] px-3 py-2 text-white/75">Anulează</button></span>}</span></form>;
}