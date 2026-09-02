import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";

export default async function Home() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role === "paravet") redirect("/queue");
  if (!profile.address_pincode) redirect("/address");
  redirect("/home");
}
