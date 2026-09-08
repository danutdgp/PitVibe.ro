"use client";

import { useState } from "react";

export function PrivacyPreferences() {
  const [saved, setSaved] = useState(false);
  function save(value: "necessary" | "accepted") { localStorage.setItem("pitvibe_cookie_preference", value); setSaved(true); }
  return <section className="card p-6"><h2 className="text-lg font-bold">Preferința ta</h2><p className="mt-2">În prezent PitVibe.ro folosește numai stocarea necesară pentru autentificare, siguranță și funcționarea aplicației. Reclamele și cookie-urile publicitare sunt dezactivate.</p><div className="mt-5 flex flex-wrap gap-3"><button className="button-primary" onClick={() => save("necessary")}>Păstrează doar necesare</button><button className="button-secondary" onClick={() => save("accepted")}>Acceptă opționale când vor exista</button></div>{saved && <p role="status" className="mt-4 text-sm font-semibold text-emerald-300">Preferința a fost salvată pe acest dispozitiv.</p>}</section>;
}
