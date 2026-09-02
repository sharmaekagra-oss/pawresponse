export type Role = "owner" | "paravet";

export type Address = {
  address_street: string;
  address_locality: string;
  address_city: string;
  address_landmark: string;
  address_pincode: string;
};

export function formatAddress(a: Address): string {
  const parts = [a.address_street, a.address_locality, a.address_city];
  let line = parts.filter(Boolean).join(", ");
  if (a.address_landmark) line += ` (near ${a.address_landmark})`;
  if (a.address_pincode) line += ` - ${a.address_pincode}`;
  return line;
}

export type Profile = Address & {
  id: string;
  email: string;
  role: Role;
  full_name: string;
  phone: string;
  is_available: boolean;
  role_confirmed: boolean;
  created_at: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string;
  age_years: number;
  medical_notes: string;
  created_at: string;
};

export type Clinic = {
  id: string;
  name: string;
  address: string;
  phone: string;
};

export type Urgency = "red" | "yellow" | "green";
export type RequestStatus =
  | "pending"
  | "triaged"
  | "accepted"
  | "en_route"
  | "reached"
  | "resolved"
  | "cancelled";
export type DispatchDecision = "home_visit" | "advise_home_care" | "escalate_clinic";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "cash" | "upi" | "other";
export type VisitOutcome =
  | "resolved"
  | "follow_up_requested"
  | "ambulance_requested"
  | "referred_clinic";

export type EmergencyRequest = Address & {
  id: string;
  pet_id: string;
  owner_id: string;
  description: string;
  urgency: Urgency;
  status: RequestStatus;
  assigned_vet_id: string | null;
  triage_note: string;
  triage_attachments: string[];
  dispatch_decision: DispatchDecision | null;
  clinic_id: string | null;
  dest_lat: number | null;
  dest_lng: number | null;
  vet_lat: number | null;
  vet_lng: number | null;
  vet_location_updated_at: string | null;
  eta_minutes: number | null;
  photo_url: string | null;
  cancellation_reason: string | null;
  reached_at: string | null;
  reached_photo_url: string | null;
  resolution_notes: string;
  resolution_attachments: string[];
  visit_outcome: VisitOutcome | null;
  tests_recommended: string;
  fee_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  red: "Critical",
  yellow: "Urgent",
  green: "Non-urgent",
};

// Reserved exclusively for the triage/urgency system — not reused as decorative
// or brand color elsewhere, so these three colors keep one unambiguous meaning.
export const URGENCY_CLASS: Record<Urgency, string> = {
  red: "bg-red-50 text-red-700 border-red-200",
  yellow: "bg-yellow-50 text-yellow-800 border-yellow-300",
  green: "bg-green-50 text-green-700 border-green-200",
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  triaged: "Triaged",
  accepted: "Accepted",
  en_route: "En route",
  reached: "Paravet has arrived",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export const VISIT_OUTCOME_LABEL: Record<VisitOutcome, string> = {
  resolved: "Resolved",
  follow_up_requested: "Follow-up visit requested",
  ambulance_requested: "Ambulance requested",
  referred_clinic: "Referred to clinic",
};

export const STATUS_CLASS: Record<RequestStatus, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-300",
  triaged: "bg-purple-50 text-purple-700 border-purple-200",
  accepted: "bg-sky-50 text-sky-700 border-sky-200",
  en_route: "bg-orange-50 text-orange-700 border-orange-200",
  reached: "bg-teal-50 text-teal-700 border-teal-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-slate-50 text-slate-400 border-slate-200",
};
