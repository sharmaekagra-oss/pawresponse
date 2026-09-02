import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import AddressCaptureForm from "@/app/address/AddressCaptureForm";
import BackButton from "@/app/auth/BackButton";

export default async function AddressPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; return?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");

  const { error, return: returnTo } = await searchParams;

  return (
    <div className="mx-auto max-w-md animate-fade-in-up px-4 py-10">
      <BackButton href="/onboarding" />
      <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="icon-badge tilt-3 h-12 w-12 !rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 text-2xl">
            📍
          </span>
          <h1 className="text-2xl font-bold text-slate-900 underline-squiggle">
            Your address
          </h1>
          <p className="text-sm text-slate-500">
            Saved once so you never have to type it during an emergency.
          </p>
        </div>
        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <AddressCaptureForm
          defaultStreet={profile.address_street}
          defaultLocality={profile.address_locality}
          defaultCity={profile.address_city}
          defaultLandmark={profile.address_landmark}
          defaultPincode={profile.address_pincode}
          returnTo={returnTo || "/home"}
        />
      </div>
    </div>
  );
}
