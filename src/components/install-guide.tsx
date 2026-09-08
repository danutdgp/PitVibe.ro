"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export function InstallGuide() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  async function install() { if (!prompt) return; await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
  return <div className="space-y-5">{prompt && <button className="button-primary" type="button" onClick={install}>Instalează PitVibe.ro</button>}<section className="card p-6"><h2 className="text-lg font-bold">Android și desktop</h2><p className="mt-2">Deschide meniul browserului și alege „Instalează aplicația” sau „Adaugă pe ecranul principal”. Dacă butonul de mai sus este disponibil, îl poți folosi direct.</p></section><section className="card p-6"><h2 className="text-lg font-bold">iPhone și iPad</h2><p className="mt-2">Deschide PitVibe.ro în Safari, apasă butonul Partajare, apoi „Adăugați pe ecranul principal” și confirmă cu „Adăugați”.</p></section><p className="text-sm text-[#918a9e]">Instalarea completă necesită versiunea publicată prin HTTPS. Localhost este acceptat pentru testare în browserele compatibile.</p></div>;
}
