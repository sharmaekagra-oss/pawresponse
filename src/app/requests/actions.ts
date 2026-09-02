"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const petId = formData.get("pet_id") as string;

  // Address is always the owner's saved dispatch address, read fresh from their
  // profile rather than trusted from the form — it's the source of truth set on /address.
  const { data: profile } = await supabase
    .from("profiles")
    .select("address_street, address_locality, address_city, address_landmark, address_pincode")
    .eq("id", user.id)
    .single();

  if (!profile?.address_pincode) {
    redirect("/address?return=/requests/new");
  }

  const dest = await geocodeAddress(
    `${profile.address_street}, ${profile.address_locality}, ${profile.address_city}, ${profile.address_pincode}, India`,
  );

  let photoUrl: string | null = null;
  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("emergency-photos")
      .upload(path, photo, { contentType: photo.type });
    if (!uploadError) {
      photoUrl = supabase.storage.from("emergency-photos").getPublicUrl(path).data.publicUrl;
    }
  }

  const { data: inserted } = await supabase
    .from("emergency_requests")
    .insert({
      pet_id: petId,
      owner_id: user.id,
      description: formData.get("description") as string,
      address_street: profile.address_street,
      address_locality: profile.address_locality,
      address_city: profile.address_city,
      address_landmark: profile.address_landmark,
      address_pincode: profile.address_pincode,
      urgency: formData.get("urgency") as string,
      dest_lat: dest?.lat ?? null,
      dest_lng: dest?.lng ?? null,
      photo_url: photoUrl,
    })
    .select("id")
    .single();

  revalidatePath("/requests");
  redirect(inserted ? `/requests/${inserted.id}` : "/requests");
}

export async function cancelRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  const reason = (formData.get("reason") as string).trim();

  await supabase
    .from("emergency_requests")
    .update({ status: "cancelled", cancellation_reason: reason })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
}
