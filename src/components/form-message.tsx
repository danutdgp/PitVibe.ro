export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>{error ?? message}</div>;
}
