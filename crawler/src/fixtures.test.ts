import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import { cardSelector, type CrawlerSite } from "./sites/selectors";
import { crawlStoria } from "./sites/storia";
import { crawlImobiliare } from "./sites/imobiliare";

const snapshots: Record<CrawlerSite, { title: string; href: string; price: string }> = {
  olx: { title: "Apartament OLX", href: "/d/oferta/apartament-ID1.html", price: "89 000 €" },
  storia: { title: "Apartament Storia", href: "/ro/oferta/apartament-ID1", price: "95 000 €" },
  imobiliare: { title: "Apartament Imobiliare", href: "/oferta/apartament-de-vanzare-ID1", price: "102 000 €" },
  homezz: { title: "Apartament HomeZZ", href: "/apartament-de-2-camere-52mp-torontalului-3643526.html", price: "78 000 €" },
  publi24: { title: "Apartament Publi24", href: "/anunt/apartament-ID1", price: "81 000 €" },
};

test("saved site fixtures match listing-card snapshots", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const site of Object.keys(snapshots) as CrawlerSite[]) {
      const html = await readFile(new URL(`./fixtures/${site}.html`, import.meta.url), "utf8");
      await page.setContent(html);
      const actual = await page.locator(cardSelector(site)).first().evaluate((card) => ({
        // Oglindește ce fac scraperele: pe homezz cardul ESTE ancora, iar
        // titlul stă într-un div cu clasă, nu într-un heading.
        title: (card.querySelector('h2, h3, h6, [class*="title"], [class*="titlu"]')?.textContent ?? "").trim(),
        href: (card.matches("a[href]") ? card.getAttribute("href") : card.querySelector("a")?.getAttribute("href")) ?? "",
        price: card.querySelector('[class*="price"], [class*="pret"], [data-testid="ad-price"], [data-cy="listing-item-price"]')?.textContent?.trim() ?? "",
      }));
      assert.deepEqual(actual, snapshots[site], `${site} fixture changed`);
    }
  } finally {
    await browser.close();
  }
});

test("crawlStoria parses a saved search-result fixture", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const fixtureUrl = new URL("./fixtures/storia.html", import.meta.url).href;
    const listings = await crawlStoria(page, fixtureUrl, "sale");
    assert.equal(listings.length, 1);
    assert.deepEqual(
      { title: listings[0].title, price: listings[0].price, source: listings[0].source, transaction: listings[0].transaction_type },
      { title: "Apartament Storia", price: 95000, source: "storia", transaction: "sale" }
    );
  } finally {
    await browser.close();
  }
});

test("crawlImobiliare parses a saved search-result fixture", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const fixtureUrl = new URL("./fixtures/imobiliare.html", import.meta.url).href;
    const listings = await crawlImobiliare(page, fixtureUrl, "sale");
    assert.equal(listings.length, 1);
    assert.deepEqual(
      { title: listings[0].title, price: listings[0].price, source: listings[0].source, transaction: listings[0].transaction_type },
      { title: "Apartament Imobiliare", price: 102000, source: "imobiliare", transaction: "sale" }
    );
  } finally {
    await browser.close();
  }
});
