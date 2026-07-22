import assert from "node:assert/strict";
import test from "node:test";
import { crawlPaginated, resolveNextPageUrl } from "./pagination";
import { RobotsDisallowedError } from "./robots";
import type { Page } from "playwright";
import type { RawListing } from "./db";

test("resolves relative next pages and prevents pagination cycles", () => {
  const current = "https://example.test/search?page=1";
  assert.equal(resolveNextPageUrl("?page=2", current, new Set([current])), "https://example.test/search?page=2");
  assert.equal(resolveNextPageUrl(current, current, new Set([current])), null);
  assert.equal(resolveNextPageUrl(null, current, new Set()), null);
});

test("crawlPaginated keeps earlier pages when robots.txt blocks the next one", async () => {
  // imobiliare.ro interzice `/*page=*`: pagina 1 e legală, pagina 2 nu.
  // Rezultatele paginii 1 nu au voie să fie aruncate.
  const page = { evaluate: async () => "?page=2" } as unknown as Page;
  const crawlPage = async (url: string) => {
    if (url.includes("page=2")) throw new RobotsDisallowedError(url);
    return [{ listing_url: "https://imobiliare.ro/oferta/a" }] as RawListing[];
  };
  const results = await crawlPaginated(page, "https://imobiliare.ro/inchirieri-apartamente/timisoara", crawlPage);
  assert.equal(results.length, 1);
  assert.equal(results[0].listing_url, "https://imobiliare.ro/oferta/a");
});

test("crawlPaginated propagates a first-page failure so the circuit breaker sees it", async () => {
  const page = { evaluate: async () => null } as unknown as Page;
  const crawlPage = async () => { throw new Error("timeout"); };
  await assert.rejects(
    () => crawlPaginated(page, "https://imobiliare.ro/x", crawlPage),
    /timeout/
  );
});

test("crawlPaginated keeps earlier pages when a later page fails", async () => {
  const page = { evaluate: async () => "?page=2" } as unknown as Page;
  const crawlPage = async (url: string) => {
    if (url.includes("page=2")) throw new Error("navigation timeout");
    return [{ listing_url: "https://imobiliare.ro/oferta/a" }] as RawListing[];
  };
  const results = await crawlPaginated(page, "https://imobiliare.ro/start", crawlPage);
  assert.equal(results.length, 1);
});
