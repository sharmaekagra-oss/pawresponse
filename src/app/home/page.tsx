import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { isServiceableArea } from "@/lib/service-area";
import type { Pet } from "@/lib/types";

export default async function OwnerHomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "owner") redirect("/queue");
  if (!profile.address_pincode) redirect("/address");

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

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up px-6 py-10">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">
        Hi{" "}
        <span className="text-gradient underline-squiggle">
          {profile.full_name.split(" ")[0] || "there"}
        </span>{" "}
        <span className="inline-block hover:animate-wag">👋</span>
      </h1>
      <p className="mb-8 text-slate-500">What do you need right now?</p>

      {serviceable ? (
        <Link
          href="/requests/new"
          className="btn-press tilt-hover relative mb-10 flex flex-col items-center gap-2 overflow-visible rounded-[28px] rounded-tl-md border-2 border-red-200 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 px-6 py-10 text-center hover:border-red-300"
        >
          <span className="tape" aria-hidden />
          <span className="pointer-events-none absolute -right-4 -top-4 text-6xl opacity-10">
            🐾
          </span>
          <span className="pointer-events-none absolute -bottom-6 -left-4 text-6xl opacity-10">
            🐾
          </span>
          <span className="icon-badge tilt--2 h-16 w-16 animate-pulse-soft bg-white text-4xl shadow-sm">
            🚨
          </span>
          <span className="text-xl font-bold text-red-700">Request Emergency Visit</span>
          <span className="text-sm text-red-600">
            Get a paravet dispatched to your home right now
          </span>
        </Link>
      ) : (
        <div className="mb-8 flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <span className="icon-badge h-16 w-16 bg-white text-4xl shadow-sm">📍</span>
          <span className="text-xl font-bold text-slate-700">Not available in your area yet</span>
          <span className="text-sm text-slate-500">
            We don&apos;t currently dispatch paravets to your saved address.
          </span>
          <Link href="/address?return=/home" className="mt-2 text-sm text-pink-600 hover:underline">
            Update address
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/pets"
          className="tilt-hover flex flex-col items-center gap-2 rounded-2xl rounded-tr-md border border-slate-200 bg-white px-4 py-5 text-center shadow-sm hover:border-pink-300"
        >
          <span className="icon-badge tilt--2 h-10 w-10 bg-gradient-to-br from-pink-100 to-rose-100 text-xl">
            🐾
          </span>
          <span className="block text-lg font-semibold text-slate-900">My Pets</span>
          <span className="text-sm text-slate-500">
            {(pets as Pet[]).length} pet{pets.length === 1 ? "" : "s"} on file
          </span>
        </Link>
        <Link
          href="/requests"
          className="tilt-hover flex flex-col items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-5 text-center shadow-sm hover:border-pink-300"
        >
          <span className="icon-badge tilt-2 h-10 w-10 bg-gradient-to-br from-sky-100 to-purple-100 text-xl">
            📋
          </span>
          <span className="block text-lg font-semibold text-slate-900">My Requests</span>
          <span className="text-sm text-slate-500">Track status &amp; history</span>
        </Link>
      </div>
    </div>
  );
}
