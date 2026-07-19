import { supabase } from "./db";
import type { QueueSite } from "./queue";

export function parseSiteIntervals(value = process.env.CRAWLER_SITE_INTERVAL_MINUTES): Partial<Record<QueueSite, number>> {
  if (!value) return {};
  const intervals: Partial<Record<QueueSite, number>> = {};
  const validSites = new Set<QueueSite>(["olx", "storia", "imobiliare", "homezz", "publi24"]);
  for (const entry of value.split(",")) {
    const [rawSite, rawMinutes] = entry.split(":").map((part) => part.trim());
    const site = rawSite as QueueSite;
    const minutes = Number(rawMinutes);
    if (!validSites.has(site) || !Number.isFinite(minutes) || minutes < 0) {
      throw new Error(`Invalid site interval: ${entry}`);
    }
    intervals[site] = minutes;
  }
  return intervals;
}

export function isSiteDue(lastCompletedAt: string | null, intervalMinutes: number, now = Date.now()): boolean {
  if (!lastCompletedAt || intervalMinutes === 0) return true;
  return now - new Date(lastCompletedAt).getTime() >= intervalMinutes * 60_000;
}

export async function shouldCrawlSite(site: QueueSite): Promise<boolean> {
  const intervalMinutes = parseSiteIntervals()[site] ?? 0;
  if (intervalMinutes === 0) return true;
  const { data, error } = await supabase.from("crawler_site_runs").select("completed_at").eq("site", site).maybeSingle();
  if (error) throw error;
  return isSiteDue(data?.completed_at ?? null, intervalMinutes);
}

export async function recordSiteCrawl(site: QueueSite, listingCount: number): Promise<void> {
  const { error } = await supabase.from("crawler_site_runs").upsert({
    site,
    listing_count: listingCount,
    completed_at: new Date().toISOString(),
  }, { onConflict: "site" });
  if (error) throw error;
}
