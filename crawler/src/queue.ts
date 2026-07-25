import type { Page } from "playwright";
import { alertOnZeroResults } from "./alerts";
import { supabase, upsertListings } from "./db";
import { crawlHomezz } from "./sites/homezz";
import { crawlImobiliare } from "./sites/imobiliare";
import { crawlOlx } from "./sites/olx";
import { crawlPubli24 } from "./sites/publi24";
import { crawlStoria } from "./sites/storia";
import { crawlerCircuitBreaker } from "./circuitBreaker";
import { filterNewListings } from "./incremental";
import { crawlPaginated } from "./pagination";
import { applySiteTimeout } from "./timeouts";
import { crawlerMemoryMonitor } from "./memory";
import { crawlLogger } from "./logger";
import { isSiteEnabled } from "./siteConfig";
import { parseListings } from "./parser";
import { logParseSummary } from "./parseSummary";

export type QueueSite = "olx" | "storia" | "imobiliare" | "homezz" | "publi24";
export interface CrawlJob {
  id: string;
  site: QueueSite;
  search_url: string;
  transaction_type: "sale" | "rent";
  label: string;
}
export interface QueueCrawlCounts { parsed: number; newListings: number; }

export function isQueueMode(value = process.env.CRAWLER_QUEUE_ENABLED): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export async function claimCrawlJob(workerId: string): Promise<CrawlJob | null> {
  const { data, error } = await supabase.rpc("claim_crawl_job", { claiming_worker_id: workerId });
  if (error) throw error;
  return (data?.[0] as CrawlJob | undefined) ?? null;
}

export async function finishCrawlJob(id: string, errorMessage?: string): Promise<void> {
  const { error } = await supabase.from("crawl_jobs").update({
    status: errorMessage ? "failed" : "done",
    completed_at: new Date().toISOString(),
    error_message: errorMessage?.slice(0, 2000) ?? null,
  }).eq("id", id);
  if (error) throw error;
}

export async function processCrawlJob(page: Page, job: CrawlJob, dryRun: boolean): Promise<QueueCrawlCounts> {
  if (!isSiteEnabled(job.site)) throw new Error(`Crawler site ${job.site} is disabled`);
  applySiteTimeout(page, job.site);
  const crawlers = { olx: crawlOlx, storia: crawlStoria, imobiliare: crawlImobiliare, homezz: crawlHomezz, publi24: crawlPubli24 };
  const listings = await crawlerCircuitBreaker.execute(job.site, () =>
    crawlPaginated(page, job.search_url, (url) => crawlers[job.site](page, url, job.transaction_type))
  );
  await alertOnZeroResults({ site: job.site, searchLabel: job.label, searchUrl: job.search_url, resultCount: listings.length });
  // Aceeași etapă de parsare ca în rularea statică: modul coadă nu are voie să
  // scrie în bază anunțuri neîncadrate.
  const parsedListings = parseListings(listings);
  logParseSummary({ site: job.site, label: job.label }, parsedListings);
  const newListings = dryRun ? parsedListings : await filterNewListings(parsedListings);
  if (!dryRun) await upsertListings(newListings);
  return { parsed: parsedListings.length, newListings: newListings.length };
}

export async function drainCrawlQueue(pageFor: (site: QueueSite) => Promise<Page>, workerId: string, dryRun: boolean): Promise<QueueCrawlCounts> {
  const counts: QueueCrawlCounts = { parsed: 0, newListings: 0 };
  for (;;) {
    const job = await claimCrawlJob(workerId);
    if (!job) return counts;
    try {
      const page = await pageFor(job.site);
      crawlLogger.log("queue_job_started", { job_id: job.id, site: job.site });
      const jobCounts = await processCrawlJob(page, job, dryRun);
      counts.parsed += jobCounts.parsed;
      counts.newListings += jobCounts.newListings;
      await finishCrawlJob(job.id);
      crawlLogger.log("queue_job_completed", { job_id: job.id, site: job.site });
      crawlerMemoryMonitor.sample(`after-job-${job.site}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      await finishCrawlJob(job.id, detail);
      crawlLogger.log("queue_job_failed", { job_id: job.id, site: job.site, error: detail });
    }
  }
}
