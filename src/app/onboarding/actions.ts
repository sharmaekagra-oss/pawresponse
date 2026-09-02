"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDigitsForCode } from "@/lib/country-codes";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = formData.get("role") as string;
  const firstName = (formData.get("first_name") as string).trim();
  const lastName = (formData.get("last_name") as string).trim();
  const phoneCode = formData.get("phone_code") as string;
  const phoneNumber = formData.get("phone_number") as string;

  const expectedDigits = getDigitsForCode(phoneCode);
  if (!new RegExp(`^\\d{${expectedDigits}}$`).test(phoneNumber)) {
    redirect(
      `/onboarding?error=${encodeURIComponent(`Phone number must be exactly ${expectedDigits} digits for this country code.`)}`,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      phone: `${phoneCode}${phoneNumber}`,
      full_name: `${firstName} ${lastName}`.trim(),
      role_confirmed: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("completeOnboarding update failed:", error);
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
