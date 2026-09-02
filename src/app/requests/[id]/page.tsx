import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  formatAddress,
  VISIT_OUTCOME_LABEL,
  type Clinic,
  type EmergencyRequest,
  type Pet,
  type Profile,
} from "@/lib/types";
import { formatFee } from "@/lib/pricing";
import TrackingView from "@/app/requests/[id]/TrackingView";

type RequestRow = EmergencyRequest & {
  pets: Pet;
  assigned_vet: Profile | null;
  clinics: Clinic | null;
};

export default async function RequestTrackingPage({ params }: PageProps<"/requests/[id]">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "owner") redirect("/queue");

  const { id } = await params;
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("emergency_requests")
    .select("*, pets(*), assigned_vet:profiles!assigned_vet_id(*), clinics(*)")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .single();

  if (!req) notFound();

  const row = req as unknown as RequestRow;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/requests" className="text-sm text-pink-600 hover:underline">
        ← Back to requests
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-bold text-slate-900">
        {row.pets.name}&apos;s emergency
      </h1>
      <p className="mb-2 text-sm text-slate-500">{row.description}</p>
      {row.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.photo_url}
          alt="Photo submitted with the request"
          className="mb-6 h-40 w-40 rounded-lg border border-slate-200 object-cover"
        />
      )}

      <TrackingView
        requestId={row.id}
        initial={{
          status: row.status,
          eta_minutes: row.eta_minutes,
          vet_lat: row.vet_lat,
          vet_lng: row.vet_lng,
          vet_location_updated_at: row.vet_location_updated_at,
        }}
        destLat={row.dest_lat}
        destLng={row.dest_lng}
        addressLabel={formatAddress(row)}
        vetName={row.assigned_vet?.full_name ?? null}
        vetPhone={row.assigned_vet?.phone ?? null}
      />

      {row.reached_photo_url && (
        <div className="mt-4">
          <p className="mb-1 text-sm text-slate-500">Photo evidence of arrival</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.reached_photo_url}
            alt="Photo evidence the paravet has arrived"
            className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
          />
        </div>
      )}
      {row.triage_note && (
        <p className="mt-4 text-sm text-slate-500">Triage note: {row.triage_note}</p>
      )}
      {row.triage_attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {row.triage_attachments.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-pink-600 hover:bg-slate-50"
            >
              📎 Attachment {i + 1}
            </a>
          ))}
        </div>
      )}
      {row.status === "resolved" && row.resolution_notes && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-700">Post-visit summary</p>
          {row.visit_outcome && (
            <p className="mt-1 text-sm font-semibold text-green-700">
              Outcome: {VISIT_OUTCOME_LABEL[row.visit_outcome]}
            </p>
          )}
          <p className="mt-1 text-sm text-green-700">{row.resolution_notes}</p>
          {row.tests_recommended && (
            <p className="mt-1 text-sm text-green-700">
              Tests recommended: {row.tests_recommended}
            </p>
          )}
          {row.resolution_attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {row.resolution_attachments.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-green-300 bg-white px-3 py-1 text-sm text-green-700 hover:bg-green-100"
                >
                  📎 Attachment {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      {row.fee_amount > 0 && (
        <p className="mt-4 text-sm text-slate-700">
          Visit fee: <span className="font-semibold">{formatFee(row.fee_amount)}</span>{" "}
          {row.payment_status === "paid" ? (
            <span className="text-green-700">
              · Paid via {row.payment_method}
              {row.paid_at && ` at ${new Date(row.paid_at).toLocaleTimeString()}`}
            </span>
          ) : (
            <span className="text-slate-500">· Payable in person (cash/UPI)</span>
          )}
        </p>
      )}
      {row.status === "cancelled" && row.cancellation_reason && (
        <p className="mt-2 text-sm text-slate-500">
          Cancellation reason: {row.cancellation_reason}
        </p>
      )}
      {(row.dispatch_decision === "escalate_clinic" || row.visit_outcome === "referred_clinic") &&
        row.clinics && (
        <p className="mt-2 rounded border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700">
          Referred to {row.clinics.name}, {row.clinics.address} ({row.clinics.phone})
        </p>
      )}

      <a
        href={`mailto:support@pawresponse.app?subject=${encodeURIComponent(
          `Help with request ${row.id}`,
        )}`}
        className="mt-6 inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        💬 Contact Support
      </a>
    </div>
  );
}
