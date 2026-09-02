"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveAddress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const addressStreet = (formData.get("address_street") as string).trim();
  const addressLocality = (formData.get("address_locality") as string).trim();
  const addressCity = (formData.get("address_city") as string).trim();
  const addressLandmark = (formData.get("address_landmark") as string).trim();
  const addressPincode = formData.get("address_pincode") as string;
  const returnTo = (formData.get("return_to") as string) || "/home";

  const back = (message: string) =>
    redirect(
      `/address?error=${encodeURIComponent(message)}&return=${encodeURIComponent(returnTo)}`,
    );

  if (!addressStreet || !addressLocality || !addressCity) {
    back("Street, locality, and city are required.");
  }
  if (!/^\d{6}$/.test(addressPincode)) {
    back("Pincode must be exactly 6 digits.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      address_street: addressStreet,
      address_locality: addressLocality,
      address_city: addressCity,
      address_landmark: addressLandmark,
      address_pincode: addressPincode,
    })
    .eq("id", user.id);

  if (error) {
    back(error.message);
    return;
  }

  revalidatePath("/home");
  revalidatePath("/requests/new");
  redirect(returnTo);
}
