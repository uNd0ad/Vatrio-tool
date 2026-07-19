import { supabase } from "./db";

export function staleCutoff(staleAfterDays: number, now = Date.now()): string {
  if (!Number.isFinite(staleAfterDays) || staleAfterDays < 1) throw new RangeError("staleAfterDays must be at least 1");
  return new Date(now - staleAfterDays * 86_400_000).toISOString();
}

export async function markStaleListings(staleAfterDays = Number(process.env.CRAWLER_STALE_AFTER_DAYS ?? 30)): Promise<number> {
  const cutoff = staleCutoff(staleAfterDays);
  const { data, error } = await supabase
    .from("listings")
    .update({ is_stale: true })
    .eq("is_stale", false)
    .is("deleted_at", null)
    .lt("last_seen_at", cutoff)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
