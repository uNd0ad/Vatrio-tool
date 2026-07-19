import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { cardSelector, type CrawlerSite } from "./sites/selectors";

const alternateLayouts: Record<CrawlerSite, string> = {
  olx: '<article data-testid="listing-grid-item"><a href="/variant">OLX variant</a></article>',
  storia: '<div data-testid="listing-item"><a href="/ro/oferta/variant">Storia variant</a></div>',
  imobiliare: '<div data-testid="listing-card"><a href="/anunt/variant">Imobiliare variant</a></div>',
  homezz: '<div id="anunt_variant"><a href="/variant-anunt-1">HomeZZ variant</a></div>',
  publi24: '<li id="ad_variant"><a href="/anunt/variant">Publi24 variant</a></li>',
};

test("site card selectors recognize alternate layout variants", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const site of Object.keys(alternateLayouts) as CrawlerSite[]) {
      await page.setContent(alternateLayouts[site]);
      assert.equal(await page.locator(cardSelector(site)).count(), 1, `${site} alternate layout`);
    }
  } finally {
    await browser.close();
  }
});
