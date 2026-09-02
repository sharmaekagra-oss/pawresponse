import type { DispatchDecision, Urgency } from "@/lib/types";

// Flat-rate home-visit fee, scaled by urgency tier. Home-care advice and
// clinic escalations aren't billed by the paravet directly.
const HOME_VISIT_FEE_BY_URGENCY: Record<Urgency, number> = {
  red: 800,
  yellow: 500,
  green: 300,
};

export function computeFee(urgency: Urgency, decision: DispatchDecision | null): number {
  if (decision !== "home_visit") return 0;
  return HOME_VISIT_FEE_BY_URGENCY[urgency];
}

export function formatFee(amountRupees: number): string {
  return `₹${amountRupees}`;
}
