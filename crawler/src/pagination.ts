import type { Page } from "playwright";
import type { RawListing } from "./db";
import { RobotsDisallowedError } from "./robots";

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
    try {
      for (const listing of await crawlPage(currentUrl)) byUrl.set(listing.listing_url, listing);
    } catch (error) {
      // Oprirea pe robots.txt e o decizie de politică, nu o eroare: pagina
      // interzisă nu e accesată, dar paginile deja obținute legal se păstrează.
      // (imobiliare.ro interzice `/*page=*`, deci se oprește după pagina 1.)
      if (error instanceof RobotsDisallowedError) {
        console.log(`[Pagination] Oprire conform robots.txt după ${visited.size - 1} ${visited.size === 2 ? "pagină" : "pagini"}: ${error.message}`);
        break;
      }
      // Un eșec pe prima pagină înseamnă că sursa e cu adevărat indisponibilă
      // și trebuie să ajungă la circuit breaker; unul pe paginile următoare nu
      // are voie să arunce rezultatele deja adunate.
      if (visited.size === 1) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`[Pagination] Pagina ${visited.size} a eșuat; se păstrează rezultatele anterioare: ${detail}`);
      break;
    }
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
