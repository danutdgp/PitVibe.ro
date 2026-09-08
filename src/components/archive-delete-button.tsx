"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveDeleteButton({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm("Ștergi definitiv acest story din arhivă?")) return;
    setBusy(true);
    const response = await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
    if (response.ok) router.refresh(); else setBusy(false);
  }
  return <button className="rounded-full px-2 py-1 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50" title="Șterge definitiv" type="button" onClick={remove} disabled={busy}>{busy ? "..." : "Șterge"}</button>;
}
