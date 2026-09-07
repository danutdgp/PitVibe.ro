import { PostComposer } from "@/components/post-composer";
export const metadata = { title: "Publică" };
export default function PublishPage() { return <><p className="text-sm font-semibold text-violet-300">Spune-ne ce se întâmplă</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Creează o postare</h1><div className="mt-7"><PostComposer /></div></>; }
