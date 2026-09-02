import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { completeOnboarding } from "@/app/onboarding/actions";
import NameFields from "@/app/auth/NameFields";
import PhoneField from "@/app/auth/PhoneField";
import BackButton from "@/app/auth/BackButton";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { error } = await searchParams;
  const [defaultFirstName = "", defaultLastName = ""] = profile.full_name.split(" ", 2);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md animate-fade-in-up flex-col justify-center gap-6 px-4 py-10">
      <BackButton href="/login" />
      <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="icon-badge h-12 w-12 bg-gradient-to-br from-pink-100 to-rose-100 text-2xl">
            👋
          </span>
          <h1 className="text-2xl font-bold text-slate-900">One more step</h1>
          <p className="text-sm text-slate-500">
            Tell us who you are so we can route you to the right place.
          </p>
        </div>
        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-slate-500">I am a...</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors has-[:checked]:border-pink-400 has-[:checked]:bg-pink-50">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  defaultChecked={profile.role !== "paravet"}
                  required
                />
                Pet owner
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors has-[:checked]:border-pink-400 has-[:checked]:bg-pink-50">
                <input
                  type="radio"
                  name="role"
                  value="paravet"
                  defaultChecked={profile.role === "paravet"}
                  required
                />
                Paravet
              </label>
            </div>
          </fieldset>
          <NameFields defaultFirstName={defaultFirstName} defaultLastName={defaultLastName} />
          <PhoneField />
          <button
            type="submit"
            className="btn-press btn-gradient rounded px-3 py-2 font-semibold text-white"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
