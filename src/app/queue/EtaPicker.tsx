"use client";

import { useState, useTransition } from "react";
import { updateEta } from "@/app/queue/actions";
import type { Urgency } from "@/lib/types";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rougher assumed driving speed for more urgent cases (more direct route, less delay).
const URGENCY_SPEED_KMH: Record<Urgency, number> = { red: 32, yellow: 28, green: 24 };

// Used when we don't yet know the paravet's live position (distance unknown).
const URGENCY_FALLBACK_MINUTES: Record<Urgency, number[]> = {
  red: [5, 10, 15],
  yellow: [10, 15, 20, 30],
  green: [15, 30, 45],
};

export default function EtaPicker({
  requestId,
  urgency,
  destLat,
  destLng,
  vetLat,
  vetLng,
  currentEta,
}: {
  requestId: string;
  urgency: Urgency;
  destLat: number | null;
  destLng: number | null;
  vetLat: number | null;
  vetLng: number | null;
  currentEta: number | null;
}) {
  const [eta, setEta] = useState(currentEta != null ? String(currentEta) : "");
  const [isPending, startTransition] = useTransition();

  let suggestions: number[];
  let distanceLabel: string | null = null;

  if (destLat !== null && destLng !== null && vetLat !== null && vetLng !== null) {
    const distanceKm = haversineKm(vetLat, vetLng, destLat, destLng);
    const speed = URGENCY_SPEED_KMH[urgency];
    const base = Math.max(2, Math.round((distanceKm / speed) * 60));
    suggestions = Array.from(new Set([Math.max(2, base - 5), base, base + 10])).sort(
      (a, b) => a - b,
    );
    distanceLabel = `~${distanceKm.toFixed(1)} km away`;
  } else {
    suggestions = URGENCY_FALLBACK_MINUTES[urgency];
  }

  // Picking a suggestion sets the ETA immediately (no separate "Set ETA" click
  // needed) so the owner's tracking page reflects it right away via Realtime.
  function pickSuggestion(minutes: number) {
    setEta(String(minutes));
    const formData = new FormData();
    formData.set("id", requestId);
    formData.set("eta_minutes", String(minutes));
    startTransition(() => {
      updateEta(formData);
    });
  }

  return (
    <form action={updateEta} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={requestId} />
      <label className="text-xs text-slate-500">
        Suggested ETA{distanceLabel && ` (${distanceLabel})`}
        {isPending && <span className="ml-1 text-pink-500">saving…</span>}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {suggestions.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickSuggestion(m)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              eta === String(m)
                ? "border-pink-400 bg-pink-50 text-pink-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <input
          name="eta_minutes"
          type="number"
          min="1"
          max="240"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className="w-24 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        />
        <button
          type="submit"
          className="rounded bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          Set ETA
        </button>
      </div>
    </form>
  );
}
