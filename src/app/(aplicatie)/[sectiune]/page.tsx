import { notFound } from "next/navigation";

const sections: Record<string, [string, string]> = {
  descopera: ["Descoperă", "Căutarea de oameni și potrivirea după interese sosesc în etapa 3."],
  publica: ["Publică", "Crearea postărilor cu fotografii va fi construită în etapa 2."],
  iesim: ["Ieșim?", "Propunerile de ieșiri, evenimentele și locurile sosesc în etapa 3."],
  profil: ["Profilul tău", "Editarea profilului, interesele și postările sosesc în etapa 2."],
  mesaje: ["Mesaje", "Conversațiile și cererile de contact sosesc în etapa 4."],
  notificari: ["Notificări", "Notificările din aplicație sosesc în etapa 4."],
};

export default async function SectionPage({ params }: { params: Promise<{ sectiune: string }> }) {
  const { sectiune } = await params; const section = sections[sectiune]; if (!section) notFound();
  return <section><p className="text-sm font-semibold text-violet-300">PitVibe.ro</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">{section[0]}</h1><div className="card mt-8 px-6 py-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-400/10 text-2xl">◇</div><h2 className="mt-5 text-lg font-bold">În pregătire</h2><p className="mx-auto mt-2 max-w-md leading-7 text-[#aaa4b8]">{section[1]}</p></div></section>;
}
