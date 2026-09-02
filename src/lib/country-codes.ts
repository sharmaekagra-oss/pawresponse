export const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)", digits: 10 },
  { code: "+1", label: "US/Canada (+1)", digits: 10 },
  { code: "+44", label: "UK (+44)", digits: 10 },
  { code: "+61", label: "Australia (+61)", digits: 9 },
  { code: "+971", label: "UAE (+971)", digits: 9 },
  { code: "+65", label: "Singapore (+65)", digits: 8 },
  { code: "+974", label: "Qatar (+974)", digits: 8 },
  { code: "+966", label: "Saudi Arabia (+966)", digits: 9 },
] as const;

export function getDigitsForCode(code: string): number {
  return COUNTRY_CODES.find((c) => c.code === code)?.digits ?? 10;
}
