"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDigitsForCode } from "@/lib/country-codes";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = (formData.get("first_name") as string).trim();
  const lastName = (formData.get("last_name") as string).trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const phoneCode = formData.get("phone_code") as string;
  const phoneNumber = formData.get("phone_number") as string;
  const phone = `${phoneCode}${phoneNumber}`;
  const role = formData.get("role") as string;
  const supabase = await createClient();

  const expectedDigits = getDigitsForCode(phoneCode);
  if (!new RegExp(`^\\d{${expectedDigits}}$`).test(phoneNumber)) {
    redirect(
      `/signup?error=${encodeURIComponent(`Phone number must be exactly ${expectedDigits} digits for this country code.`)}`,
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: { full_name: fullName, phone, role },
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/signup?success=1");
  }

  redirect("/");
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
