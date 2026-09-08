"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
async function authenticated() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/autentificare"); return { supabase, user }; }

export async function checkInZone(data: FormData) {
  const zoneId = Number(value(data, "zone_id")); const response = value(data, "response"); if (!Number.isSafeInteger(zoneId) || zoneId < 1 || !["here", "going", "maybe"].includes(response)) return;
  const { supabase } = await authenticated(); await supabase.rpc("check_in_zone", { target_zone: zoneId, target_response: response }); revalidatePath("/zone");
}

export async function leaveZone(data: FormData) {
  const zoneId = Number(value(data, "zone_id")); if (!Number.isSafeInteger(zoneId) || zoneId < 1) return;
  const { supabase } = await authenticated(); await supabase.rpc("leave_zone", { target_zone: zoneId }); revalidatePath("/zone");
}

export async function toggleLike(data: FormData) {
  const postId = value(data, "post_id"); const { supabase, user } = await authenticated();
  const { data: existing } = await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  revalidatePath("/acasa"); revalidatePath(`/postare/${postId}`);
}

export async function toggleSave(data: FormData) {
  const postId = value(data, "post_id"); const { supabase, user } = await authenticated();
  const { data: existing } = await supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from("saved_posts").insert({ post_id: postId, user_id: user.id });
  revalidatePath("/acasa"); revalidatePath(`/postare/${postId}`);
}

export async function addComment(data: FormData) {
  const postId = value(data, "post_id"); const parentId = value(data, "parent_id") || null; const content = value(data, "comentariu"); if (!content || content.length > 1000) return;
  const { supabase, user } = await authenticated(); await supabase.from("comments").insert({ post_id: postId, parent_id: parentId, author_id: user.id, content });
  revalidatePath(`/postare/${postId}`); revalidatePath("/acasa");
}

export async function updateComment(data: FormData) {
  const commentId = value(data, "comment_id"); const postId = value(data, "post_id"); const content = value(data, "comentariu"); if (!content || content.length > 1000) return;
  const { supabase, user } = await authenticated(); await supabase.from("comments").update({ content }).eq("id", commentId).eq("author_id", user.id); revalidatePath(`/postare/${postId}`); redirect(`/postare/${postId}#comentarii`);
}

export async function deleteComment(data: FormData) {
  const commentId = value(data, "comment_id"); const postId = value(data, "post_id"); const { supabase, user } = await authenticated(); await supabase.from("comments").delete().eq("id", commentId).eq("author_id", user.id); revalidatePath(`/postare/${postId}`);
}

export async function deletePost(data: FormData) {
  const postId = value(data, "post_id"); const { supabase, user } = await authenticated();
  const { data: post } = await supabase.from("posts").select("author_id, post_media(storage_path)").eq("id", postId).single();
  if (!post || post.author_id !== user.id) return;
  const paths = post.post_media.map((item) => item.storage_path); const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
  if (!error && paths.length) await supabase.storage.from("post-media").remove(paths);
  revalidatePath("/acasa"); redirect("/acasa");
}

export async function updatePost(data: FormData) {
  const postId = value(data, "post_id"); const content = value(data, "continut"); if (content.length > 3000) return;
  const { supabase, user } = await authenticated(); if (!content) { const { count } = await supabase.from("post_media").select("id", { count: "exact", head: true }).eq("post_id", postId); if (!count) return; } await supabase.from("posts").update({ content }).eq("id", postId).eq("author_id", user.id);
  revalidatePath(`/postare/${postId}`); redirect(`/postare/${postId}`);
}

export async function toggleFollow(data: FormData) {
  const targetId = value(data, "user_id"); const username = value(data, "username"); const { supabase, user } = await authenticated(); if (targetId === user.id) return;
  const { data: existing } = await supabase.from("follows").select("status").eq("follower_id", user.id).eq("followed_id", targetId).maybeSingle();
  if (existing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("followed_id", targetId);
  else await supabase.from("follows").insert({ follower_id: user.id, followed_id: targetId });
  revalidatePath("/acasa");
  revalidatePath(`/profil/${username}`);
}

export async function respondFollow(data: FormData) {
  const followerId = value(data, "follower_id"); const decision = value(data, "decizie"); const { supabase, user } = await authenticated();
  if (decision === "accept") await supabase.from("follows").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("follower_id", followerId).eq("followed_id", user.id);
  else await supabase.from("follows").delete().eq("follower_id", followerId).eq("followed_id", user.id);
  revalidatePath("/profil");
}

export async function sendGesture(data: FormData) {
  const recipientId = value(data, "recipient_id"); const username = value(data, "username"); const { supabase, user } = await authenticated();
  if (!recipientId || recipientId === user.id) return;
  const { error } = await supabase.from("profile_gestures").upsert({ sender_id: user.id, recipient_id: recipientId, gesture_type: "rose" }, { onConflict: "sender_id,recipient_id", ignoreDuplicates: true });
  if (error) redirect(`/profil/${username}?eroare_gest=${encodeURIComponent("Gestul nu a putut fi trimis.")}`);
  revalidatePath(`/profil/${username}`); revalidatePath("/notificari");
}

export async function toggleGesture(data: FormData) {
  const recipientId = value(data, "recipient_id"); const username = value(data, "username"); const { supabase, user } = await authenticated();
  if (!recipientId || recipientId === user.id) return;
  const { data: existing } = await supabase.from("profile_gestures").select("sender_id").eq("sender_id", user.id).eq("recipient_id", recipientId).maybeSingle();
  const result = existing
    ? await supabase.from("profile_gestures").delete().eq("sender_id", user.id).eq("recipient_id", recipientId)
    : await supabase.from("profile_gestures").insert({ sender_id: user.id, recipient_id: recipientId, gesture_type: "rose" });
  if (result.error) redirect(`/profil/${username}?eroare_gest=${encodeURIComponent("Gestul nu a putut fi actualizat.")}`);
  revalidatePath(`/profil/${username}`); revalidatePath("/notificari");
}

export async function updateGender(data: FormData) {
  const gender = value(data, "gen"); const { supabase, user } = await authenticated();
  if (!["female", "male"].includes(gender)) redirect("/profil/editeaza?eroare=Selectează%20genul%20profilului.");
  const { error } = await supabase.from("profiles").update({ gender }).eq("id", user.id);
  if (error) redirect("/profil/editeaza?eroare=Genul%20nu%20a%20putut%20fi%20salvat.");
  revalidatePath("/profil"); revalidatePath("/profil/editeaza"); redirect("/profil/editeaza?mesaj=Genul%20a%20fost%20salvat.");
}

export async function respondGesture(data: FormData) {
  const senderId = value(data, "sender_id"); const decision = value(data, "decizie"); const { supabase, user } = await authenticated();
  if (!senderId || senderId === user.id || !["accept", "reject"].includes(decision)) return;
  if (decision === "accept") {
    await supabase.rpc("accept_profile_gesture", { sender: senderId });
    revalidatePath("/mesaje"); revalidatePath("/notificari");
  }
  revalidatePath("/notificari");
}

export async function updateProfile(data: FormData) {
  const { supabase, user } = await authenticated(); const username = value(data, "username").toLowerCase(); const displayName = value(data, "nume"); const bio = value(data, "descriere");
  if (!/^[a-z0-9_]{3,24}$/.test(username) || displayName.length < 2 || displayName.length > 50 || bio.length > 500) redirect("/profil/editeaza?eroare=Datele%20profilului%20nu%20sunt%20valide.");
  const relationship = value(data, "status") || null; const gender = ["female", "male"].includes(value(data, "gen")) ? value(data, "gen") : null; const interestIds = data.getAll("interese").map(Number).filter(Number.isInteger).slice(0, 10); const datingEnabled = data.get("dating") === "on"; const allowedIntentions = new Set(["friendship", "relationship", "activities"]); const intentions = datingEnabled ? data.getAll("intentii").map(String).filter((item) => allowedIntentions.has(item)) : [];
  const { error } = await supabase.from("profiles").update({ username, display_name: displayName, bio, city: value(data, "oras"), gender, relationship_status: relationship, show_relationship_status: Boolean(relationship && data.get("arata_status")), dating_discovery_enabled: datingEnabled, dating_intentions: intentions }).eq("id", user.id);
  if (error) redirect(`/profil/editeaza?eroare=${encodeURIComponent(error.code === "23505" ? "Username-ul este deja folosit." : "Profilul nu a putut fi salvat.")}`);
  await supabase.from("profile_interests").delete().eq("user_id", user.id);
  if (interestIds.length) await supabase.from("profile_interests").insert(interestIds.map((interest_id) => ({ user_id: user.id, interest_id })));
  revalidatePath("/profil"); redirect("/profil");
}

export async function updateArea(data: FormData) {
  const areaId = Number(value(data, "zona")); const selectedArea = Number.isSafeInteger(areaId) && areaId > 0 ? areaId : null;
  const { supabase, user } = await authenticated();
  if (!selectedArea) await supabase.from("profile_areas").delete().eq("user_id", user.id);
  else await supabase.from("profile_areas").upsert({ user_id: user.id, area_id: selectedArea, visible: data.get("arata_zona") === "on" });
  revalidatePath("/profil"); revalidatePath("/profil/editeaza");
}

export async function toggleEventInterest(data: FormData) {
  const eventId = value(data, "event_id"); const { supabase, user } = await authenticated(); const { data: existing } = await supabase.from("event_interests").select("event_id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("event_interests").delete().eq("event_id", eventId).eq("user_id", user.id); else await supabase.from("event_interests").insert({ event_id: eventId, user_id: user.id }); revalidatePath("/iesim"); revalidatePath(`/iesim/${eventId}`);
}

export async function deleteEvent(data: FormData) {
  const eventId = value(data, "event_id"); const { supabase, user } = await authenticated(); const { data: event } = await supabase.from("events").select("organizer_id, photo_path").eq("id", eventId).single(); if (!event || event.organizer_id !== user.id) return;
  const { error } = await supabase.from("events").delete().eq("id", eventId).eq("organizer_id", user.id); if (!error && event.photo_path) await supabase.storage.from("event-media").remove([event.photo_path]); revalidatePath("/iesim"); redirect("/iesim");
}
