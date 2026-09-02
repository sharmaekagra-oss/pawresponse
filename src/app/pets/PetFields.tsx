"use client";

import { useState } from "react";
import { SPECIES_OPTIONS, BREED_OPTIONS, AGE_OPTIONS } from "@/lib/pet-options";

const inputClass =
  "rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100";

export default function PetFields({
  defaultSpecies = "Dog",
  defaultBreed = "",
  defaultAgeYears = 0,
}: {
  defaultSpecies?: string;
  defaultBreed?: string;
  defaultAgeYears?: number;
}) {
  const knownSpecies = SPECIES_OPTIONS.includes(
    defaultSpecies as (typeof SPECIES_OPTIONS)[number],
  );
  const [species, setSpecies] = useState(knownSpecies ? defaultSpecies : "Other");

  const breedOptions = BREED_OPTIONS[species] ?? BREED_OPTIONS.Other;
  const knownBreed = breedOptions.includes(defaultBreed);
  const [breed, setBreed] = useState(knownBreed ? defaultBreed || breedOptions[0] : "Other");

  const defaultAgeValue = String(Math.min(20, Math.max(0, Math.round(defaultAgeYears))));

  return (
    <>
      <div className="flex flex-col gap-2">
        <select
          name={species === "Other" ? undefined : "species"}
          required={species !== "Other"}
          value={species}
          onChange={(e) => {
            setSpecies(e.target.value);
            setBreed((BREED_OPTIONS[e.target.value] ?? BREED_OPTIONS.Other)[0]);
          }}
          className={inputClass}
        >
          {SPECIES_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {species === "Other" && (
          <input
            name="species"
            placeholder="Specify species"
            required
            defaultValue={knownSpecies ? "" : defaultSpecies}
            className={inputClass}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <select
          key={species}
          name={breed === "Other" ? undefined : "breed"}
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className={inputClass}
        >
          {breedOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {breed === "Other" && (
          <input
            name="breed"
            placeholder="Specify breed"
            defaultValue={knownBreed ? "" : defaultBreed}
            className={inputClass}
          />
        )}
      </div>

      <select name="age_years" defaultValue={defaultAgeValue} className={`${inputClass} sm:col-span-2`}>
        {AGE_OPTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
    </>
  );
}
