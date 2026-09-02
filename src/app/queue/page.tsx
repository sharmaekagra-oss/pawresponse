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
import {
  claimRequest,
  markEnRoute,
  markReached,
  markResolved,
  submitTriage,
  toggleAvailability,
} from "@/app/queue/actions";
import LocationSharer from "@/app/queue/LocationSharer";
import EtaPicker from "@/app/queue/EtaPicker";
import QueueRealtimeWatcher from "@/app/queue/QueueRealtimeWatcher";
import { formatFee } from "@/lib/pricing";

type RequestRow = EmergencyRequest & { pets: Pet; owner: Profile };

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role_confirmed) redirect("/onboarding");
  if (profile.role !== "paravet") redirect("/pets");

  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: openQueue } = await supabase
    .from("emergency_requests")
    .select("*, pets(*), owner:profiles!owner_id(*)")
    .is("assigned_vet_id", null)
    .in("status", ["pending"])
    .order("urgency")
    .order("created_at");

  const { data: mine } = await supabase
    .from("emergency_requests")
    .select("*, pets(*), owner:profiles!owner_id(*)")
    .eq("assigned_vet_id", profile.id)
    .in("status", ["accepted", "triaged", "en_route", "reached"])
    .order("created_at", { ascending: false });

  const { data: resolved } = await supabase
    .from("emergency_requests")
    .select("*, pets(*), owner:profiles!owner_id(*)")
    .eq("assigned_vet_id", profile.id)
    .eq("status", "resolved")
    .order("updated_at", { ascending: false })
    .limit(20);

  const { data: clinics } = await supabase.from("clinics").select("*").order("name");

  const URGENCY_BORDER: Record<string, string> = {
    red: "border-l-4 border-l-red-400",
    yellow: "border-l-4 border-l-yellow-400",
    green: "border-l-4 border-l-green-400",
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up px-6 py-8">
      <QueueRealtimeWatcher />
      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dispatch Queue</h1>
        <form action={toggleAvailability}>
          <input type="hidden" name="is_available" value={String(profile.is_available)} />
          <button
            type="submit"
            className={`btn-press rounded px-3 py-1.5 text-sm font-semibold ${
              profile.is_available
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {profile.is_available ? "● Available" : "○ Offline"}
          </button>
        </form>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Open requests</h2>
        {!openQueue || openQueue.length === 0 ? (
          <p className="text-slate-500">No pending requests right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(openQueue as unknown as RequestRow[]).map((req) => (
              <div
                key={req.id}
                className={`card-lift rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${URGENCY_BORDER[req.urgency]}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${URGENCY_CLASS[req.urgency]}`}
                  >
                    {URGENCY_LABEL[req.urgency]}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {req.pets.name} · {req.pets.species}
                  </span>
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
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {req.owner.full_name} ({req.owner.phone})
                </p>
                <form action={claimRequest} className="mt-3">
                  <input type="hidden" name="id" value={req.id} />
                  <button
                    type="submit"
                    className="btn-press rounded bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pink-600"
                  >
                    Accept case
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My active cases</h2>
        {!mine || mine.length === 0 ? (
          <p className="text-slate-500">Nothing assigned to you right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(mine as unknown as RequestRow[]).map((req) => (
              <div
                key={req.id}
                className={`card-lift rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${URGENCY_BORDER[req.urgency]}`}
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
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {req.owner.full_name} ({req.owner.phone})
                </p>

                {req.status === "accepted" && (
                  <form
                    action={submitTriage}
                    className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4"
                  >
                    <input type="hidden" name="id" value={req.id} />
                    <label className="text-xs text-slate-500">
                      Triage note (simulated assessment call)
                    </label>
                    <textarea
                      name="triage_note"
                      required
                      rows={2}
                      placeholder="What did you learn from talking to the owner?"
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                    <label className="text-xs text-slate-500">
                      Attach images or files (photos, PDF, Word, text)
                    </label>
                    <input
                      name="attachments"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-purple-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <label className="text-xs text-slate-500">Decision</label>
                    <select
                      name="dispatch_decision"
                      required
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="home_visit">Dispatch home visit</option>
                      <option value="advise_home_care">Advise home care (resolve)</option>
                      <option value="escalate_clinic">Escalate to partner clinic</option>
                    </select>
                    <select
                      name="clinic_id"
                      className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">Select clinic (if escalating)</option>
                      {(clinics as Clinic[] | null)?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="mt-1 rounded bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                      Submit triage
                    </button>
                  </form>
                )}

                {req.status === "triaged" && req.dispatch_decision === "home_visit" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                    {req.fee_amount > 0 && (
                      <p className="text-sm font-semibold text-slate-700">
                        Visit fee: {formatFee(req.fee_amount)}
                      </p>
                    )}
                    <EtaPicker
                      requestId={req.id}
                      urgency={req.urgency}
                      destLat={req.dest_lat}
                      destLng={req.dest_lng}
                      vetLat={req.vet_lat}
                      vetLng={req.vet_lng}
                      currentEta={req.eta_minutes}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <form action={markEnRoute}>
                        <input type="hidden" name="id" value={req.id} />
                        <button
                          type="submit"
                          className="rounded bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700"
                        >
                          Mark en route
                        </button>
                      </form>
                      <LocationSharer requestId={req.id} />
                    </div>
                  </div>
                )}

                {req.status === "en_route" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                    <EtaPicker
                      requestId={req.id}
                      urgency={req.urgency}
                      destLat={req.dest_lat}
                      destLng={req.dest_lng}
                      vetLat={req.vet_lat}
                      vetLng={req.vet_lng}
                      currentEta={req.eta_minutes}
                    />
                    <form
                      action={markReached}
                      className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3"
                    >
                      <input type="hidden" name="id" value={req.id} />
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">
                          Photo evidence of reaching (required)
                        </label>
                        <input
                          name="photo"
                          type="file"
                          accept="image/*"
                          required
                          className="text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
                      >
                        ✅ Confirm reached
                      </button>
                    </form>
                    <div className="flex flex-wrap items-center gap-3">
                      <LocationSharer requestId={req.id} />
                    </div>
                  </div>
                )}

                {req.status === "reached" && (
                  <div className="mt-4 flex animate-scale-in flex-col gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-teal-700">
                      ✅ You confirmed reaching this location
                      {req.reached_at &&
                        ` at ${new Date(req.reached_at).toLocaleTimeString()}`}
                      .
                    </p>
                    {req.reached_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={req.reached_photo_url}
                        alt="Photo evidence of reaching the location"
                        className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                    <form action={markResolved} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={req.id} />
                      <label className="text-xs text-slate-500">Visit outcome</label>
                      <select
                        name="visit_outcome"
                        required
                        defaultValue=""
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        <option value="" disabled>
                          What happens next?
                        </option>
                        <option value="resolved">Resolved</option>
                        <option value="follow_up_requested">
                          Request schedule further visit
                        </option>
                        <option value="ambulance_requested">Request ambulance</option>
                        <option value="referred_clinic">Refer clinic</option>
                      </select>
                      <label className="text-xs text-slate-500">
                        If referring to a clinic, which one?
                      </label>
                      <select
                        name="referred_clinic_id"
                        defaultValue=""
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      >
                        <option value="">Select clinic (if referring)</option>
                        {(clinics as Clinic[] | null)?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <label className="text-xs text-slate-500">
                        Tests recommended (optional)
                      </label>
                      <input
                        name="tests_recommended"
                        type="text"
                        placeholder="e.g. Blood panel, X-ray"
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                      <label className="text-xs text-slate-500">
                        Post-visit notes &amp; further treatment recommendations (if
                        needed)
                      </label>
                      <textarea
                        name="resolution_notes"
                        required
                        rows={3}
                        placeholder="What did you find, what did you do, and what should the owner watch for or follow up on?"
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                      />
                      <label className="text-xs text-slate-500">
                        Attach images or files (photos, PDF, Word, text)
                      </label>
                      <input
                        name="resolution_attachments"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
                      />
                      {req.fee_amount > 0 && (
                        <>
                          <label className="text-xs text-slate-500">
                            Visit fee: {formatFee(req.fee_amount)}, collect payment before
                            resolving
                          </label>
                          <select
                            name="payment_method"
                            required
                            defaultValue=""
                            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
                          >
                            <option value="" disabled>
                              How did they pay?
                            </option>
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="other">Other</option>
                          </select>
                        </>
                      )}
                      <button
                        type="submit"
                        className="mt-1 w-fit rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Mark resolved
                      </button>
                    </form>
                  </div>
                )}

                {req.status === "triaged" && req.dispatch_decision === "escalate_clinic" && (
                  <form action={markResolved} className="mt-3">
                    <input type="hidden" name="id" value={req.id} />
                    <button
                      type="submit"
                      className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Mark resolved
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Resolved Cases</h2>
        {!resolved || resolved.length === 0 ? (
          <p className="text-slate-500">No resolved cases yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(resolved as unknown as RequestRow[]).map((req) => (
              <div
                key={req.id}
                className={`card-lift rounded-lg border border-slate-200 bg-white p-4 opacity-90 shadow-sm ${URGENCY_BORDER[req.urgency]}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[req.status]}`}
                  >
                    {STATUS_LABEL[req.status]}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{req.pets.name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(req.updated_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{req.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {req.owner.full_name} ({req.owner.phone})
                </p>
                {req.visit_outcome && (
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    Outcome: {VISIT_OUTCOME_LABEL[req.visit_outcome]}
                  </p>
                )}
                {req.resolution_notes && (
                  <p className="mt-1 text-sm text-slate-500">{req.resolution_notes}</p>
                )}
                {req.fee_amount > 0 && (
                  <p className="mt-1 text-sm text-slate-700">
                    Fee: {formatFee(req.fee_amount)}{" "}
                    {req.payment_status === "paid" ? (
                      <span className="text-green-700">· Paid ({req.payment_method})</span>
                    ) : (
                      <span className="text-slate-500">· Unpaid</span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
