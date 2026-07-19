import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { cardSelector, type CrawlerSite } from "./sites/selectors";

const categories = ["apartments", "houses", "land", "commercial"] as const;

const cards: Record<CrawlerSite, (category: string) => string> = {
  olx: (category) => `<div data-cy="l-card" data-category="${category}"><a href="/${category}">Listing</a></div>`,
  storia: (category) => `<article data-cy="listing-item" data-category="${category}"><a href="/ro/oferta/${category}">Listing</a></article>`,
  imobiliare: (category) => `<div class="card-anunt" data-category="${category}"><a href="/oferta/${category}">Listing</a></div>`,
  homezz: (category) => `<div class="anunt-${category}"><a href="/${category}-anunt.html">Listing</a></div>`,
  publi24: (category) => `<article class="card-${category}"><a href="/anunt/${category}">Listing</a></article>`,
};

test("card selectors match every supported property category", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const [site, renderCard] of Object.entries(cards) as Array<[CrawlerSite, (category: string) => string]>) {
      await page.setContent(categories.map(renderCard).join(""));
      const matches = page.locator(cardSelector(site));
      assert.equal(await matches.count(), categories.length, `${site} category coverage`);
      assert.deepEqual(
        await matches.evaluateAll((elements) => elements.map((element) => element.querySelector("a")?.getAttribute("href"))),
        categories.map((category) => site === "storia" ? `/ro/oferta/${category}` : site === "imobiliare" ? `/oferta/${category}` : site === "publi24" ? `/anunt/${category}` : site === "homezz" ? `/${category}-anunt.html` : `/${category}`)
      );
    }
  } finally {
    await browser.close();
  }
});
