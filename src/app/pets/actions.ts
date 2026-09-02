"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Used by the dedicated add-pet screen (/pets/new) — inserts and then redirects
// into the "add another?" step instead of staying on a list page.
export async function createPetOnboarding(formData: FormData) {
  const { supabase, userId } = await requireOwner();

  await supabase.from("pets").insert({
    owner_id: userId,
    name: formData.get("name") as string,
    species: formData.get("species") as string,
    breed: formData.get("breed") as string,
    age_years: parseFloat(formData.get("age_years") as string) || 0,
    medical_notes: formData.get("medical_notes") as string,
  });

  revalidatePath("/pets");
  redirect("/pets/new?added=1");
}

export async function updatePet(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = formData.get("id") as string;

  await supabase
    .from("pets")
    .update({
      name: formData.get("name") as string,
      species: formData.get("species") as string,
      breed: formData.get("breed") as string,
      age_years: parseFloat(formData.get("age_years") as string) || 0,
      medical_notes: formData.get("medical_notes") as string,
    })
    .eq("id", id);

  revalidatePath("/pets");
}

export async function deletePet(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = formData.get("id") as string;

  await supabase.from("pets").delete().eq("id", id);

  revalidatePath("/pets");
}
