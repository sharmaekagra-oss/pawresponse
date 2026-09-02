"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { STATUS_CLASS, STATUS_LABEL, type EmergencyRequest } from "@/lib/types";

// Leaflet touches `window` at import time, which breaks server rendering — load it
// client-only.
const LeafletMap = dynamic(() => import("@/app/requests/[id]/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Loading map...
    </div>
  ),
});

type LiveFields = Pick<
  EmergencyRequest,
  "status" | "eta_minutes" | "vet_lat" | "vet_lng" | "vet_location_updated_at"
>;

export default function TrackingView({
  requestId,
  initial,
  destLat,
  destLng,
  addressLabel,
  vetName,
  vetPhone,
}: {
  requestId: string;
  initial: LiveFields;
  destLat: number | null;
  destLng: number | null;
  addressLabel: string;
  vetName: string | null;
  vetPhone: string | null;
}) {
  const [live, setLive] = useState<LiveFields>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emergency_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          setLive(payload.new as LiveFields);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId]);

  const hasVetPosition = live.vet_lat !== null && live.vet_lng !== null;
  const hasDest = destLat !== null && destLng !== null;
  const center: [number, number] = hasVetPosition
    ? [live.vet_lat as number, live.vet_lng as number]
    : hasDest
      ? [destLat as number, destLng as number]
      : [12.9716, 77.5946]; // Bengaluru fallback if geocoding failed

  const showReassurance = ["accepted", "triaged", "en_route"].includes(live.status);
  const hasReached = live.status === "reached";

  return (
    <div className="flex animate-fade-in-up flex-col gap-4">
      <span
        className={`w-fit rounded border px-2 py-0.5 text-xs font-semibold transition-colors duration-500 ${STATUS_CLASS[live.status]}`}
      >
        {STATUS_LABEL[live.status]}
      </span>

      {hasReached ? (
        <div className="card-lift animate-scale-in rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 px-4 py-4 text-center">
          <span className="icon-badge mx-auto mb-1 h-10 w-10 bg-white text-xl shadow-sm">
            🐾
          </span>
          <p className="font-semibold text-teal-700">
            Your paravet has arrived at your location.
          </p>
          {vetName && (
            <p className="mt-1 text-sm text-teal-600">
              {vetName} {vetPhone && `(${vetPhone})`}
            </p>
          )}
        </div>
      ) : showReassurance ? (
        <div className="card-lift animate-scale-in rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 px-4 py-4 text-center">
          <span className="icon-badge mx-auto mb-1 h-10 w-10 bg-white text-xl shadow-sm">
            🐾
          </span>
          <p className="font-semibold text-pink-700">Do not panic, help will be here soon.</p>
          {vetName && (
            <p className="mt-1 text-sm text-pink-600">
              {vetName} {vetPhone && `(${vetPhone})`} has been assigned to you.
            </p>
          )}
          {live.eta_minutes != null && (
            <p className="mt-1 text-sm font-semibold text-pink-700">
              Estimated arrival: {live.eta_minutes} min
            </p>
          )}
        </div>
      ) : live.status === "pending" ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
          <span className="animate-pulse-soft text-2xl">🐾</span>
          A paravet will accept your request very soon and call you immediately to
          assess the situation.
        </div>
      ) : null}

      <div className="card-lift h-72 w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <LeafletMap
          center={center}
          zoom={hasVetPosition ? 14 : 12}
          destLat={destLat}
          destLng={destLng}
          addressLabel={addressLabel}
          vetLat={live.vet_lat}
          vetLng={live.vet_lng}
          vetName={vetName}
        />
      </div>
      {hasVetPosition && live.vet_location_updated_at && (
        <p className="text-xs text-slate-400">
          Location updated {new Date(live.vet_location_updated_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
