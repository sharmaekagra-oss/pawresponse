"use client";

import { useState } from "react";

const onlyLetters = (value: string) => value.replace(/[^a-zA-Z ]/g, "");

export default function NameFields({
  defaultFirstName = "",
  defaultLastName = "",
}: {
  defaultFirstName?: string;
  defaultLastName?: string;
}) {
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="first_name" className="text-sm text-slate-500">
          First name
        </label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          required
          pattern="[a-zA-Z ]+"
          title="Letters only"
          value={firstName}
          onChange={(e) => setFirstName(onlyLetters(e.target.value))}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="last_name" className="text-sm text-slate-500">
          Last name
        </label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          required
          pattern="[a-zA-Z ]+"
          title="Letters only"
          value={lastName}
          onChange={(e) => setLastName(onlyLetters(e.target.value))}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        />
      </div>
    </div>
  );
}
