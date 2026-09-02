import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  formatAddress,
  STATUS_CLASS,
  STATUS_LABEL,
  URGENCY_CLASS,
  URGENCY_LABEL,
  VISIT_OUTCOME_LABEL,
  type Clinic,
  type EmergencyRequest,
  type Pet,
  type Profile,
} from "@/lib/types";
import CancelRequestButton from "@/app/requests/CancelRequestButton";
import { formatFee } from "@/lib/pricing";

type RequestRow = EmergencyRequest & {
  pets: Pet;
  assigned_vet: Profile | null;
  clinics: Clinic | null;
};

export default async function RequestsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "owner") redirect("/queue");

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("emergency_requests")
    .select("*, pets(*), assigned_vet:profiles!assigned_vet_id(*), clinics(*)")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const URGENCY_BORDER: Record<string, string> = {
    red: "border-l-4 border-l-red-400",
    yellow: "border-l-4 border-l-yellow-400",
    green: "border-l-4 border-l-green-400",
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="icon-badge h-10 w-10 bg-gradient-to-br from-sky-100 to-purple-100 text-xl">
            📋
          </span>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
        </div>
        <Link
          href="/requests/new"
          className="btn-press btn-gradient-critical rounded px-4 py-2 text-sm font-semibold text-white"
        >
          🚨 New request
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/40 py-10 text-center">
          <span className="text-3xl">📋</span>
          <p className="text-slate-500">
            No requests yet.{" "}
            <Link href="/requests/new" className="text-pink-600 hover:underline">
              Request an emergency visit
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(requests as unknown as RequestRow[]).map((req, i) => (
            <div
              key={req.id}
              className={`card-lift animate-fade-in-up stagger-${Math.min(i, 5)} rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${URGENCY_BORDER[req.urgency]}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${URGENCY_CLASS[req.urgency]}`}
                >
                  {URGENCY_LABEL[req.urgency]}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[req.status]}`}
                >
                  {STATUS_LABEL[req.status]}
                </span>
                <span className="text-sm font-semibold text-slate-900">{req.pets.name}</span>
              </div>
              <p className="text-sm text-slate-700">{req.description}</p>
              {req.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={req.photo_url}
                  alt="Photo submitted with the request"
                  className="mt-2 h-28 w-28 rounded-lg border border-slate-200 object-cover"
                />
              )}
              <p className="mt-1 text-xs text-slate-500">{formatAddress(req)}</p>

              {req.assigned_vet && (
                <p className="mt-2 text-sm text-sky-700">
                  Assigned paravet: {req.assigned_vet.full_name} ({req.assigned_vet.phone})
                </p>
              )}
              {req.triage_note && (
                <p className="mt-1 text-sm text-slate-500">
                  Triage note: {req.triage_note}
                </p>
              )}
              {req.dispatch_decision === "escalate_clinic" && req.clinics && (
                <p className="mt-1 text-sm text-purple-700">
                  Referred to {req.clinics.name}, {req.clinics.address} (
                  {req.clinics.phone})
                </p>
              )}
              {req.status === "resolved" && req.visit_outcome && (
                <p className="mt-1 text-sm font-semibold text-green-700">
                  Outcome: {VISIT_OUTCOME_LABEL[req.visit_outcome]}
                </p>
              )}
              {req.fee_amount > 0 && (
                <p className="mt-1 text-sm text-slate-700">
                  Fee: {formatFee(req.fee_amount)}{" "}
                  {req.payment_status === "paid" ? (
                    <span className="text-green-700">· Paid</span>
                  ) : (
                    <span className="text-slate-500">· Unpaid</span>
                  )}
                </p>
              )}

              <div className="mt-3 flex flex-col gap-3">
                {req.status !== "resolved" && req.status !== "cancelled" && (
                  <Link
                    href={`/requests/${req.id}`}
                    className="btn-press btn-gradient w-fit rounded px-3 py-1 text-xs font-semibold text-white"
                  >
                    Track
                  </Link>
                )}
                {(req.status === "pending" || req.status === "triaged") && (
                  <CancelRequestButton requestId={req.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
