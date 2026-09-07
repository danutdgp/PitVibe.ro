import { StoryComposer } from "@/components/story-composer";

export const metadata = { title: "Story nou" };

export default function NewStoryPage() {
  return <><p className="text-sm font-semibold text-violet-300">Povestea ta</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Creează un story</h1><div className="mt-7"><StoryComposer /></div></>;
}
