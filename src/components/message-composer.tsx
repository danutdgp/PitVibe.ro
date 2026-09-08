"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { EmojiTextField } from "@/components/emoji-text-field";

export function MessageComposer({ action, conversationId }: { action: (data: FormData) => void; conversationId: string }) {
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { if (!message.trim()) { event.preventDefault(); return; } setMessage(""); }
  return <form action={action} onSubmit={submit} className="sticky bottom-20 mt-6 flex gap-2 rounded-2xl border border-white/10 bg-[#0d0a13]/95 p-3 backdrop-blur-xl md:bottom-3"><input type="hidden" name="conversation_id" value={conversationId} /><EmojiTextField name="mesaj" value={message} onValueChange={setMessage} maxLength={4000} required placeholder="Scrie un mesaj…" className="field pr-12" /><button className="button-primary shrink-0" type="submit">Trimite</button></form>;
}
