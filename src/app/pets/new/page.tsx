import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { createPetOnboarding } from "@/app/pets/actions";
import PetFields from "@/app/pets/PetFields";
import BackButton from "@/app/auth/BackButton";
import PawMark from "@/components/PawMark";

export default async function NewPetOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "owner") redirect("/queue");

  const { added } = await searchParams;

  if (added) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm animate-scale-in flex-col justify-center gap-6 px-4 text-center">
        <span className="icon-badge tilt-3 mx-auto h-20 w-20 bg-gradient-to-br from-pink-100 to-rose-100">
          <PawMark className="h-12 w-12 text-pink-500" />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Pet added 🎉</h1>
        <p className="text-slate-500">Want to add another pet now?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/pets/new"
            className="btn-press btn-gradient rounded px-4 py-2 font-semibold text-white"
          >
            Add another pet
          </Link>
          <Link
            href="/home"
            className="btn-press rounded bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
          >
            No, I&apos;m done, take me to PawResponse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in-up px-6 py-10">
      <BackButton href="/address" />
      <div className="mb-6 flex items-center gap-3">
        <span className="icon-badge tilt--2 h-12 w-12 bg-gradient-to-br from-pink-100 to-rose-100">
          <PawMark className="h-6 w-6 text-pink-500" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add your first pet</h1>
          <p className="text-sm text-slate-500">
            We need at least one pet on file before you can request an emergency visit.
          </p>
        </div>
      </div>
      <form
        action={createPetOnboarding}
        className="grid gap-3 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/60 to-rose-50/40 p-5 shadow-sm sm:grid-cols-2"
      >
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 sm:col-span-2"
        />
        <PetFields />
        <textarea
          name="medical_notes"
          placeholder="Medical notes (allergies, conditions, medications...)"
          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 sm:col-span-2"
        />
        <button
          type="submit"
          className="btn-press btn-gradient rounded px-4 py-2 font-semibold text-white sm:col-span-2"
        >
          Add pet
        </button>
      </form>
    </div>
  );
}
