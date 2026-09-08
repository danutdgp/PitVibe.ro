import { updateGender } from "@/app/actions/social";

export function GenderForm() {
  return <form action={updateGender} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-4"><label className="min-w-48 flex-1"><span className="mb-2 block text-sm font-semibold">Gen</span><select className="field" name="gen" defaultValue="" required><option value="" disabled>Alege o opțiune</option><option value="female">Femeie</option><option value="male">Bărbat</option></select></label><button className="button-secondary" type="submit">Salvează genul</button></form>;
}