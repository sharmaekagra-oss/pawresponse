"use client";

import { useState } from "react";
import { cancelRequest } from "@/app/requests/actions";

const CANCEL_REASONS = [
  "Situation resolved on its own",
  "Found help elsewhere",
  "Entered incorrect details",
  "It was a false alarm",
  "Taking my pet to a clinic myself",
  "Wait time is too long",
  "Other",
];

export default function CancelRequestButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
      >
        Cancel request
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-yellow-300 bg-yellow-50 p-3">
      <p className="text-sm font-semibold text-yellow-800">
        Help is already on the way. Are you sure you want to cancel?
      </p>
      <form action={cancelRequest} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="id" value={requestId} />
        <select
          name={reason === "Other" ? undefined : "reason"}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
        >
          <option value="" disabled>
            Why are you cancelling?
          </option>
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {reason === "Other" && (
          <input
            name="reason"
            type="text"
            required
            placeholder="Tell us why"
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Yes, cancel request
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Never mind
          </button>
        </div>
      </form>
    </div>
  );
}
