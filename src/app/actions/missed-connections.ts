"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function createMissedConnection(data: FormData) {
  const description = value(data, "description");
  const vehicleMake = value(data, "vehicle_make");
  const licensePlate = value(data, "license_plate").toUpperCase().replace(/[\s-]/g, "");
  const errorPath = (message: string) => redirect(`/conexiuni-ratate?eroare=${encodeURIComponent(message)}`);

  if (description.length < 10 || description.length > 2000) errorPath("Descrierea trebuie să aibă între 10 și 2000 de caractere.");
  if (vehicleMake.length < 2 || vehicleMake.length > 50) errorPath("Completează marca mașinii.");
  if (!/^[A-Z]{1,2}[0-9]{2,3}[A-Z]{1,3}$/.test(licensePlate)) errorPath("Numărul de înmatriculare nu este valid.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");

  const { error } = await supabase.from("missed_connections").insert({ author_id: user.id, description, vehicle_make: vehicleMake, license_plate: licensePlate });
  if (error) errorPath("Anunțul nu a putut fi publicat.");
  revalidatePath("/conexiuni-ratate");
  redirect("/conexiuni-ratate?publicat=1");
}