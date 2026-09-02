import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { isServiceableArea } from "@/lib/service-area";
import { formatAddress, type Pet } from "@/lib/types";
import { createRequest } from "@/app/requests/actions";
import PhotoPicker from "@/app/requests/new/PhotoPicker";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "owner") redirect("/queue");
  if (!profile.address_pincode) redirect("/address?return=/requests/new");

  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", profile.id)
    .order("name");

  if (!pets || pets.length === 0) {
    redirect("/pets/new");
  }

  const serviceable = await isServiceableArea(supabase, profile.address_pincode);

  if (!serviceable) {
    return (
      <div className="mx-auto max-w-md animate-fade-in-up px-6 py-10 text-center">
        <span className="icon-badge mx-auto h-16 w-16 bg-slate-100 text-4xl">📍</span>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          We don&apos;t serve your area yet
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {formatAddress(profile)} isn&apos;t in our coverage area right now, so we
          can&apos;t dispatch a paravet there.
        </p>
        <Link
          href="/address?return=/requests/new"
          className="btn-press btn-gradient mt-4 inline-block rounded px-4 py-2 font-semibold text-white"
        >
          Update address
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="icon-badge tilt--3 h-12 w-12 animate-pulse-soft bg-gradient-to-br from-red-100 to-pink-100 text-2xl">
          🚨
        </span>
        <div>
          <h1 className="text-2xl font-bold text-red-600">Request emergency visit</h1>
          <p className="text-sm text-slate-500">
            A paravet will be notified immediately.
          </p>
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={createRequest} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="pet_id" className="text-sm text-slate-500">
            Which pet?
          </label>
          <select
            id="pet_id"
            name="pet_id"
            required
            className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          >
            {(pets as Pet[]).map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-500">How urgent is this?</label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 transition-transform hover:scale-[1.03] has-[:checked]:ring-2 has-[:checked]:ring-red-400">
              <input type="radio" name="urgency" value="red" className="sr-only" required />
              Critical
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-800 transition-transform hover:scale-[1.03] has-[:checked]:ring-2 has-[:checked]:ring-yellow-400">
              <input
                type="radio"
                name="urgency"
                value="yellow"
                className="sr-only"
                defaultChecked
              />
              Urgent
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 transition-transform hover:scale-[1.03] has-[:checked]:ring-2 has-[:checked]:ring-green-400">
              <input type="radio" name="urgency" value="green" className="sr-only" />
              Non-urgent
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-slate-500">
            What&apos;s happening?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="e.g. Vomiting repeatedly since this morning, seems lethargic..."
            className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>

        <PhotoPicker />

        <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-500">Dispatch address</p>
          <p className="text-sm font-medium text-slate-800">{formatAddress(profile)}</p>
          <Link
            href="/address?return=/requests/new"
            className="mt-1 text-sm text-pink-600 hover:underline"
          >
            Change address
          </Link>
        </div>

        <button
          type="submit"
          className="btn-press btn-gradient-critical rounded px-4 py-2 font-semibold text-white"
        >
          Send emergency request
        </button>
      </form>
    </div>
  );
}
