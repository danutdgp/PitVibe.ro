import { notFound, redirect } from "next/navigation";
import { deletePost, updatePost } from "@/app/actions/social";
import { EmojiTextField } from "@/components/emoji-text-field";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Editează postarea" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");
  const { data: post } = await supabase.from("posts").select("id, content, author_id, post_media(id)").eq("id", id).single();
  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/postare/${id}`);
  return <><p className="text-sm font-semibold text-violet-300">Postarea ta</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Editează textul</h1><section className="card mt-7 p-6"><form action={updatePost}><input type="hidden" name="post_id" value={id} /><EmojiTextField name="continut" multiline className="field min-h-48 resize-y pr-12" maxLength={3000} defaultValue={post.content} required={!post.post_media.length} /><div className="mt-5 flex justify-end"><button className="button-primary" type="submit">Salvează modificările</button></div></form></section><section className="mt-5 rounded-3xl border border-red-400/20 bg-red-400/[.045] p-6"><h2 className="font-bold text-red-200">Șterge postarea</h2><p className="mt-2 text-sm text-[#aaa4b8]">Textul, fotografiile, aprecierile și comentariile vor fi șterse definitiv.</p><form action={deletePost} className="mt-4"><input type="hidden" name="post_id" value={id} /><button className="rounded-full bg-red-500 px-5 py-3 font-bold text-white" type="submit">Șterge definitiv</button></form></section></>;
}
