"use client";

import { useEffect, useRef, useState } from "react";
import { updateVetLocation } from "@/app/queue/actions";

const MIN_UPDATE_INTERVAL_MS = 10_000;

export default function LocationSharer({ requestId }: { requestId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  function start() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't supported by this browser.");
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < MIN_UPDATE_INTERVAL_MS) return;
        lastSentRef.current = now;
        void updateVetLocation(
          requestId,
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      () => {
        setError("Location permission denied.");
        setSharing(false);
      },
      { enableHighAccuracy: true },
    );
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={sharing ? stop : start}
        className={`rounded px-3 py-1.5 text-sm font-semibold ${
          sharing
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {sharing ? "🟢 Sharing live location" : "📍 Share live location"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
