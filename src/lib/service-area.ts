import type { SupabaseClient } from "@supabase/supabase-js";

export async function isServiceableArea(
  supabase: SupabaseClient,
  pincode: string,
): Promise<boolean> {
  if (!pincode) return false;
  const { data } = await supabase
    .from("service_areas")
    .select("pincode")
    .eq("pincode", pincode)
    .eq("is_active", true)
    .maybeSingle();
  return !!data;
}
