"use client";

import { useEffect, useState } from "react";

export function PwaManager() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const online = () => setOffline(false); const offlineListener = () => setOffline(true);
    window.addEventListener("online", online); window.addEventListener("offline", offlineListener);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offlineListener); };
  }, []);
  return offline ? <div role="status" className="fixed inset-x-0 top-0 z-[200] bg-amber-400 px-4 py-2 text-center text-sm font-bold text-[#1b1403]">Ești offline. Conținutul nou nu poate fi încărcat sau trimis.</div> : null;
}
