"use client";

import { useState } from "react";
import { COUNTRY_CODES, getDigitsForCode } from "@/lib/country-codes";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export default function PhoneField() {
  const [code, setCode] = useState("+91");
  const [number, setNumber] = useState("");
  const digits = getDigitsForCode(code);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    setNumber((n) => n.slice(0, getDigitsForCode(newCode)));
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="phone_number" className="text-sm text-slate-500">
        Phone
      </label>
      <div className="flex gap-2">
        <select
          name="phone_code"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          inputMode="numeric"
          required
          minLength={digits}
          maxLength={digits}
          pattern={`[0-9]{${digits}}`}
          title={`Exactly ${digits} digits`}
          value={number}
          onChange={(e) => setNumber(onlyDigits(e.target.value).slice(0, digits))}
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        />
      </div>
    </div>
  );
}
