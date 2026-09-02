"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeFee } from "@/lib/pricing";
import type { DispatchDecision, Urgency } from "@/lib/types";

async function requireParavet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "paravet") redirect("/pets");

  return { supabase, userId: user.id };
}

// Atomic claim: only succeeds if nobody else has claimed it first (assigned_vet_id
// still null). The `.is("assigned_vet_id", null)` clause in the WHERE is what makes
// this safe under concurrent claims, not just the RLS policy.
export async function claimRequest(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;

  await supabase
    .from("emergency_requests")
    .update({ status: "accepted", assigned_vet_id: userId })
    .eq("id", id)
    .is("assigned_vet_id", null);

  revalidatePath("/queue");
}

export async function submitTriage(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;
  const triageNote = formData.get("triage_note") as string;
  const decision = formData.get("dispatch_decision") as string;
  const clinicId = formData.get("clinic_id") as string | null;

  const files = formData.getAll("attachments") as File[];
  const attachmentUrls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("triage-attachments")
      .upload(path, file, { contentType: file.type });
    if (!uploadError) {
      attachmentUrls.push(
        supabase.storage.from("triage-attachments").getPublicUrl(path).data.publicUrl,
      );
    }
  }

  const status = decision === "advise_home_care" ? "resolved" : "triaged";

  const { data: current } = await supabase
    .from("emergency_requests")
    .select("urgency")
    .eq("id", id)
    .single();
  const feeAmount = computeFee(
    (current?.urgency ?? "yellow") as Urgency,
    decision as DispatchDecision,
  );

  const { error } = await supabase
    .from("emergency_requests")
    .update({
      triage_note: triageNote,
      triage_attachments: attachmentUrls,
      dispatch_decision: decision,
      clinic_id: decision === "escalate_clinic" ? clinicId : null,
      status,
      fee_amount: feeAmount,
    })
    .eq("id", id)
    .eq("assigned_vet_id", userId);

  if (error) {
    console.error("submitTriage update failed:", error);
    redirect(`/queue?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/queue");
}

export async function markEnRoute(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;

  await supabase
    .from("emergency_requests")
    .update({ status: "en_route" })
    .eq("id", id)
    .eq("assigned_vet_id", userId);

  revalidatePath("/queue");
}

export async function markReached(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;
  const photo = formData.get("photo") as File | null;

  if (!photo || photo.size === 0) {
    redirect(`/queue?error=${encodeURIComponent("Photo evidence is required to confirm reaching.")}`);
  }

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${id}/reached-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("emergency-photos")
    .upload(path, photo, { contentType: photo.type });

  if (uploadError) {
    redirect(`/queue?error=${encodeURIComponent("Photo upload failed, please try again.")}`);
  }

  const photoUrl = supabase.storage.from("emergency-photos").getPublicUrl(path).data.publicUrl;

  await supabase
    .from("emergency_requests")
    .update({
      status: "reached",
      reached_at: new Date().toISOString(),
      reached_photo_url: photoUrl,
    })
    .eq("id", id)
    .eq("assigned_vet_id", userId)
    .eq("status", "en_route");

  revalidatePath("/queue");
}

export async function markResolved(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;
  const resolutionNotes = (formData.get("resolution_notes") as string) ?? "";
  const paymentMethod = formData.get("payment_method") as string | null;
  const visitOutcome = formData.get("visit_outcome") as string;
  const testsRecommended = (formData.get("tests_recommended") as string) ?? "";
  const referredClinicId = formData.get("referred_clinic_id") as string | null;

  const files = formData.getAll("resolution_attachments") as File[];
  const attachmentUrls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${id}/resolution-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("triage-attachments")
      .upload(path, file, { contentType: file.type });
    if (!uploadError) {
      attachmentUrls.push(
        supabase.storage.from("triage-attachments").getPublicUrl(path).data.publicUrl,
      );
    }
  }

  const update: Record<string, unknown> = {
    status: "resolved",
    resolution_notes: resolutionNotes,
    resolution_attachments: attachmentUrls,
    visit_outcome: visitOutcome,
    tests_recommended: testsRecommended,
  };
  if (visitOutcome === "referred_clinic" && referredClinicId) {
    update.clinic_id = referredClinicId;
  }
  // Payment is collected at the same time as resolving — the last moment the
  // paravet interacts with this case before it drops off their active queue.
  if (paymentMethod) {
    update.payment_status = "paid";
    update.payment_method = paymentMethod;
    update.paid_at = new Date().toISOString();
  }

  // Only resolvable once the paravet has confirmed arrival (home visit) or the
  // case was escalated to a clinic instead (no physical visit to confirm).
  const { error } = await supabase
    .from("emergency_requests")
    .update(update)
    .eq("id", id)
    .eq("assigned_vet_id", userId)
    .or("status.eq.reached,and(status.eq.triaged,dispatch_decision.eq.escalate_clinic)");

  if (error) {
    console.error("markResolved update failed:", error);
    redirect(`/queue?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/queue");
}

export async function updateEta(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const id = formData.get("id") as string;
  const etaMinutes = parseInt(formData.get("eta_minutes") as string, 10);

  await supabase
    .from("emergency_requests")
    .update({ eta_minutes: Number.isFinite(etaMinutes) ? etaMinutes : null })
    .eq("id", id)
    .eq("assigned_vet_id", userId);

  revalidatePath("/queue");
}

// Called repeatedly (throttled client-side) while a paravet shares live location —
// not a form submission, so no revalidatePath: the owner's tracking page picks this
// up via a Supabase Realtime subscription, not Next.js's cache/navigation.
export async function updateVetLocation(id: string, lat: number, lng: number) {
  const { supabase, userId } = await requireParavet();

  await supabase
    .from("emergency_requests")
    .update({ vet_lat: lat, vet_lng: lng, vet_location_updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("assigned_vet_id", userId);
}

export async function toggleAvailability(formData: FormData) {
  const { supabase, userId } = await requireParavet();
  const isAvailable = formData.get("is_available") === "true";

  await supabase.from("profiles").update({ is_available: !isAvailable }).eq("id", userId);

  revalidatePath("/queue");
}
