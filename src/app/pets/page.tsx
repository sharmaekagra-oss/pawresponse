import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-user";
import type { Pet } from "@/lib/types";
import { updatePet, deletePet } from "@/app/pets/actions";
import PetFields from "@/app/pets/PetFields";

export default async function PetsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");

  const supabase = await createClient();
  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Pets</h1>
        <Link
          href="/pets/new"
          className="btn-press rounded bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
        >
          + Add a pet
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {(pets as Pet[] | null)?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/40 py-10 text-center">
            <span className="text-3xl">🐾</span>
            <p className="text-slate-500">
              No pets yet,{" "}
              <Link href="/pets/new" className="text-pink-600 hover:underline">
                add your first one
              </Link>
              .
            </p>
          </div>
        )}
        {(pets as Pet[] | null)?.map((pet) => (
          <form
            key={pet.id}
            action={updatePet}
            className="card-lift grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={pet.id} />
            <input
              name="name"
              defaultValue={pet.name}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
            <PetFields
              defaultSpecies={pet.species}
              defaultBreed={pet.breed}
              defaultAgeYears={pet.age_years}
            />
            <textarea
              name="medical_notes"
              defaultValue={pet.medical_notes}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 sm:col-span-2"
            />
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Save
              </button>
              <button
                type="submit"
                formAction={deletePet}
                className="rounded bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
