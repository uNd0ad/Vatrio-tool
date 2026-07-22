import { backfillMissingCoordinates, recordSuccessfulCrawl, upsertListings } from "./db";
import type { RawListing } from "./db";
import { crawlOlx } from "./sites/olx";
import { crawlImobiliare } from "./sites/imobiliare";
import { crawlStoria } from "./sites/storia";
import { crawlHomezz } from "./sites/homezz";
import { crawlPubli24 } from "./sites/publi24";
import { detectAndLinkDuplicates } from "./dedup";
import { getProxyConfig, humanDelay } from "./stealth";
import { alertOnZeroResults } from "./alerts";
import { isDryRun } from "./runtime";
import { pingHeartbeat } from "./heartbeat";
import { createCrawlerBrowserSession } from "./browserPool";
import { drainCrawlQueue, isQueueMode } from "./queue";
import { crawlerCircuitBreaker } from "./circuitBreaker";
import { recordSiteCrawl, shouldCrawlSite } from "./frequency";
import { filterNewListings } from "./incremental";
import { markStaleListings } from "./stale";
import { crawlPaginated } from "./pagination";
import { applySiteTimeout } from "./timeouts";
import { crawlerMemoryMonitor } from "./memory";
import { crawlLogger } from "./logger";
import { emailCrawlSummary } from "./summary";
import { isSiteEnabled } from "./siteConfig";
import { loadSearchConfig } from "./searchConfig";
import { cardSelector, type CrawlerSite } from "./sites/selectors";
import { Page } from "playwright";

async function validateSelectors(page: Page, site: CrawlerSite, url: string): Promise<boolean> {
  const selector = cardSelector(site);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const exists = await page.waitForSelector(selector, { timeout: 5000 }).then(() => true).catch(() => false);
    if (!exists) {
      console.warn(`[Selector Monitor] Avertisment: niciun selector de card (${site}) nu a găsit rezultate pe ${url}. Verificați selectorii!`);
      return false;
    }
    console.log(`[Selector Monitor] Succes: selectorii pentru ${site} sunt valizi.`);
    return true;
  } catch (e) {
    console.warn(`[Selector Monitor] Nu s-a putut accesa pagina pentru testare selectori:`, e);
    return false;
  }
}

async function main() {
  let crawledListingCount = 0;
  let newListingCount = 0;
  const dryRun = isDryRun();
  crawlLogger.log("run_started", { dry_run: dryRun, queue_mode: isQueueMode() });
  if (dryRun) console.log("[Dry Run] Supabase writes and deduplication are disabled.");
  const proxy = getProxyConfig();
  if (proxy) {
    console.log(`[Stealth/Proxy] Rulare prin server proxy: ${proxy.server}`);
  }

  const session = await createCrawlerBrowserSession(proxy);

  try {
    if (isQueueMode()) {
      const workerId = process.env.CRAWLER_WORKER_ID ?? `crawler-${process.pid}`;
      const counts = await drainCrawlQueue((site) => session.pageFor(site), workerId, dryRun);
      crawledListingCount = counts.parsed;
      newListingCount = counts.newListings;
      let staleFlagged = 0;
      if (!dryRun) {
        staleFlagged = await markStaleListings();
        await detectAndLinkDuplicates();
        await recordSuccessfulCrawl(crawledListingCount);
      }
      await pingHeartbeat("success");
      await emailCrawlSummary({ parsed: crawledListingCount, newListings: newListingCount, seenListings: crawledListingCount - newListingCount, staleFlagged, mode: "queue" });
      console.log(`[Queue] Worker ${workerId} drained the queue (${crawledListingCount} listings).`);
      crawlLogger.log("run_completed", { mode: "queue", worker_id: workerId, listing_count: crawledListingCount });
      return;
    }
    const searches = loadSearchConfig();
    const groups = [
      { site: "olx" as const, name: "OLX", searches: searches.olx, crawl: crawlOlx },
      { site: "imobiliare" as const, name: "Imobiliare", searches: searches.imobiliare, crawl: crawlImobiliare },
      { site: "storia" as const, name: "Storia", searches: searches.storia, crawl: crawlStoria },
      { site: "homezz" as const, name: "HomeZZ", searches: searches.homezz, crawl: crawlHomezz },
      { site: "publi24" as const, name: "Publi24", searches: searches.publi24, crawl: crawlPubli24 },
    ];
    for (const group of groups) {
      if (!isSiteEnabled(group.site)) {
        console.log(`[Site Config] Skipping disabled site ${group.name}.`);
        crawlLogger.log("site_skipped", { site: group.site, reason: "disabled" });
        continue;
      }
      if (!(await shouldCrawlSite(group.site))) {
        console.log(`[Frequency] Skipping ${group.name}; its configured interval has not elapsed.`);
        continue;
      }
      const page = await session.pageFor(group.site);
      crawlLogger.log("site_started", { site: group.site, search_count: group.searches.length });
      applySiteTimeout(page, group.site);
      if (group.searches.length > 0) await validateSelectors(page, group.site, group.searches[0].url);
      let siteListingCount = 0;
      for (const search of group.searches) {
        await humanDelay(page);
        console.log(`Crawl ${group.name} ${search.label}: ${search.url}`);
        let listings: RawListing[];
        try {
          listings = await crawlerCircuitBreaker.execute(group.site, () =>
            crawlPaginated(page, search.url, (url) => group.crawl(page, url, search.transactionType))
          );
        } catch (err) {
          // Isolate one failing search/site so the rest of the run still proceeds
          // (e.g. an open circuit breaker must not abort every remaining site).
          const detail = err instanceof Error ? err.message : String(err);
          console.warn(`[Crawl] ${group.name} ${search.label} a eșuat; se continuă cu următoarea căutare: ${detail}`);
          crawlLogger.log("search_failed", { site: group.site, label: search.label, error: detail });
          continue;
        }
        siteListingCount += listings.length;
        crawledListingCount += listings.length;
        if (dryRun) newListingCount += listings.length;
        await alertOnZeroResults({ site: group.name, searchLabel: search.label, searchUrl: search.url, resultCount: listings.length });
        const owners = listings.filter((listing) => listing.seller_type === "owner").length;
        const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
        console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${listings.length - owners - agencies} necunoscute.`);
        if (!dryRun) {
          const newListings = await filterNewListings(listings);
          newListingCount += newListings.length;
          console.log(`[Incremental] ${newListings.length}/${listings.length} listings are new.`);
          await upsertListings(newListings);
        }
      }
      if (!dryRun) await recordSiteCrawl(group.site, siteListingCount);
      crawlLogger.log("site_completed", { site: group.site, listing_count: siteListingCount });
      crawlerMemoryMonitor.sample(`after-${group.site}`);
    }



    let staleFlagged = 0;
    if (!dryRun) {
      staleFlagged = await markStaleListings();
      console.log("Rulare algoritm deduplicare...");
      await detectAndLinkDuplicates();
      await backfillMissingCoordinates();
      await recordSuccessfulCrawl(crawledListingCount);
    } else {
      console.log(`[Dry Run] Complete: ${crawledListingCount} listings parsed, 0 database writes.`);
    }
    await pingHeartbeat("success");
    await emailCrawlSummary({ parsed: crawledListingCount, newListings: newListingCount, seenListings: crawledListingCount - newListingCount, staleFlagged, mode: "static" });
    crawlLogger.log("run_completed", { mode: "static", listing_count: crawledListingCount });
  } finally {
    await session.close();
  }
}

main().catch((err) => {
  console.error("Crawler a eșuat:", err);
  crawlLogger.log("run_failed", { error: err instanceof Error ? err.message : String(err) });
  void pingHeartbeat("fail").finally(() => process.exit(1));
});
