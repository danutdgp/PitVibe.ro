"use client";

import { useEffect, useRef, useState } from "react";

const emojis = ["😀", "😂", "😍", "🥰", "😉", "😎", "🤍", "❤️", "🔥", "✨", "🎉", "🙌", "👏", "👍", "🙏", "💬", "🌹", "⚡", "☕", "🎵", "📸", "🚗", "📍", "🌙"];

type Props = { name: string; placeholder?: string; maxLength?: number; required?: boolean; multiline?: boolean; defaultValue?: string; value?: string; onValueChange?: (value: string) => void; onFocus?: () => void; onBlur?: () => void; className?: string };

export function EmojiTextField({ name, placeholder, maxLength, required, multiline = false, defaultValue = "", value: controlledValue, onValueChange, onFocus, onBlur, className = "" }: Props) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) { if (!containerRef.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function insert(emoji: string) {
    const field = fieldRef.current;
    if (!field) return;
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
    requestAnimationFrame(() => { field.focus(); const cursor = start + emoji.length; field.setSelectionRange(cursor, cursor); });
  }

  return <div ref={containerRef} className="relative">
    {multiline ? <textarea ref={fieldRef as React.RefObject<HTMLTextAreaElement>} className={className} name={name} value={value} onFocus={onFocus} onBlur={onBlur} onChange={(event) => { if (controlledValue === undefined) setInternalValue(event.target.value); onValueChange?.(event.target.value); }} placeholder={placeholder} maxLength={maxLength} required={required} /> : <input ref={fieldRef as React.RefObject<HTMLInputElement>} className={className} name={name} value={value} onFocus={onFocus} onBlur={onBlur} onChange={(event) => { if (controlledValue === undefined) setInternalValue(event.target.value); onValueChange?.(event.target.value); }} placeholder={placeholder} maxLength={maxLength} required={required} />}
    <div className="absolute bottom-2 right-2">
      <button type="button" aria-label="Adaugă emoji" title="Adaugă emoji" onClick={() => setOpen((current) => !current)} className="grid h-8 w-8 place-items-center rounded-full bg-white/[.08] text-base transition hover:bg-white/[.15]">☺</button>
      {open && <div className="absolute bottom-10 right-0 z-50 grid w-56 grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-[#171320] p-2 shadow-2xl shadow-black/40">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => insert(emoji)} className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-white/[.1]">{emoji}</button>)}</div>}
    </div>
  </div>;
}
