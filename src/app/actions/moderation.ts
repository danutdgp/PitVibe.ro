"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
export async function reviewReport(data: FormData) { const supabase = await createClient(); await supabase.rpc("review_report", { target_report: value(data, "report_id"), new_status: value(data, "status"), notes: value(data, "note") }); revalidatePath("/admin/raportari"); }
export async function removeReportedContent(data: FormData) { const supabase = await createClient(); await supabase.rpc("moderate_remove_content", { content_type: value(data, "target_type"), content_id: value(data, "target_id"), action_reason: value(data, "motiv") }); revalidatePath("/admin/raportari"); }
export async function moderateUser(data: FormData) { const supabase = await createClient(); await supabase.rpc("moderate_user", { target_user: value(data, "user_id"), suspend: value(data, "actiune") === "suspend", action_reason: value(data, "motiv") }); revalidatePath("/admin"); }
export async function createPlace(data: FormData) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; await supabase.from("places").insert({ name: value(data, "nume"), category: value(data, "categorie"), description: value(data, "descriere"), public_address: value(data, "adresa"), created_by: user.id }); revalidatePath("/admin/locuri"); revalidatePath("/locuri"); }
export async function deletePlace(data: FormData) { const supabase = await createClient(); await supabase.from("places").delete().eq("id", value(data, "place_id")); revalidatePath("/admin/locuri"); revalidatePath("/locuri"); }
export async function createManagedEvent(data: FormData) { const supabase = await createClient(); const start = new Date(value(data, "data")); if (Number.isNaN(start.getTime()) || start <= new Date()) return; await supabase.from("events").insert({ kind: "local_event", organizer_id: null, title: value(data, "titlu"), description: value(data, "descriere"), category: value(data, "categorie"), starts_at: start.toISOString(), location_name: value(data, "loc"), public_address: value(data, "adresa") }); revalidatePath("/admin/evenimente"); revalidatePath("/iesim"); }
