import type { Page } from "playwright";
import type { RawListing } from "./db";

export function resolveNextPageUrl(href: string | null, currentUrl: string, visited: ReadonlySet<string>): string | null {
  if (!href) return null;
  const next = new URL(href, currentUrl).href;
  return visited.has(next) ? null : next;
}

export async function crawlPaginated(
  page: Page,
  initialUrl: string,
  crawlPage: (url: string) => Promise<RawListing[]>,
  maxPages = Number(process.env.CRAWLER_MAX_PAGES ?? 20)
): Promise<RawListing[]> {
  if (!Number.isInteger(maxPages) || maxPages < 1) throw new RangeError("CRAWLER_MAX_PAGES must be a positive integer");
  const visited = new Set<string>();
  const byUrl = new Map<string, RawListing>();
  let currentUrl: string | null = initialUrl;
  while (currentUrl && visited.size < maxPages) {
    visited.add(currentUrl);
    for (const listing of await crawlPage(currentUrl)) byUrl.set(listing.listing_url, listing);
    const href = await page.evaluate(() => {
      const explicit = document.querySelector<HTMLAnchorElement>(
        'a[rel="next"], a[aria-label*="next" i], a[aria-label*="urm" i], a[data-testid*="pagination-forward"]'
      );
      if (explicit) return explicit.getAttribute("href");
      const textLink = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find((link) =>
        /^(next|următoarea|urmatorul|>)$/i.test(link.textContent?.trim() ?? "")
      );
      return textLink?.getAttribute("href") ?? null;
    });
    currentUrl = resolveNextPageUrl(href, currentUrl, visited);
  }
  return [...byUrl.values()];
}
