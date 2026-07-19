import { supabase } from "./db";

/**
 * Calculates ISO timestamp cutoff for listings inactive for X months.
 */
export function archiveCutoff(inactiveMonths: number, now = Date.now()): string {
  if (!Number.isFinite(inactiveMonths) || inactiveMonths < 1) {
    throw new RangeError("inactiveMonths must be at least 1");
  }
  const date = new Date(now);
  date.setMonth(date.getMonth() - inactiveMonths);
  return date.toISOString();
}

/**
 * Invokes the database RPC function to auto-archive listings inactive for X months.
 */
export async function autoArchiveInactiveListings(
  inactiveMonths = Number(process.env.AUTO_ARCHIVE_INACTIVE_MONTHS ?? 3)
): Promise<number> {
  const { data, error } = await supabase.rpc("archive_inactive_listings", {
    inactive_months: inactiveMonths,
  });
  if (error) throw error;
  return data ?? 0;
}
