import { chromium } from "playwright";
import { upsertListings } from "./db";
import { crawlOlx } from "./sites/olx";
import { crawlImobiliare } from "./sites/imobiliare";

// Adaugă aici URL-urile de căutare (cu filtrele tale: zonă, preț, tip)
// pentru fiecare sursă. Le construiești o dată în browser, cu filtrele
// setate, apoi copiezi URL-ul rezultat.
const OLX_SEARCHES = [
  {
    url: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-vanzare/timisoara/",
    transactionType: "sale" as const,
    label: "vânzare",
  },
  {
    url: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-inchiriat/timisoara/",
    transactionType: "rent" as const,
    label: "chirie",
  },
];

const IMOBILIARE_SEARCHES = [
  {
    url: "https://www.imobiliare.ro/vanzare-apartamente/timisoara",
    transactionType: "sale" as const,
    label: "vânzare",
  },
  {
    url: "https://www.imobiliare.ro/inchirieri-apartamente/timisoara",
    transactionType: "rent" as const,
    label: "chirie",
  },
];

import { Page } from "playwright";

async function validateSelectors(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const cardSelector = '[data-cy="l-card"]';
    const exists = await page.waitForSelector(cardSelector, { timeout: 5000 }).then(() => true).catch(() => false);
    if (!exists) {
      console.warn(`[Selector Monitor] Avertisment: Nu s-a găsit selectorul "${cardSelector}" pe ${url}. Verificați selectorii OLX!`);
      return false;
    }
    console.log(`[Selector Monitor] Succes: Selectorul "${cardSelector}" este valid.`);
    return true;
  } catch (e) {
    console.warn(`[Selector Monitor] Nu s-a putut accesa pagina pentru testare selectori:`, e);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "ro-RO",
    timezoneId: "Europe/Bucharest"
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });
  const page = await context.newPage();

  try {
    if (OLX_SEARCHES.length > 0) {
      await validateSelectors(page, OLX_SEARCHES[0].url);
    }
    for (const search of OLX_SEARCHES) {
      console.log(`Crawl OLX ${search.label}: ${search.url}`);
      const listings = await crawlOlx(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }

    for (const search of IMOBILIARE_SEARCHES) {
      console.log(`Crawl Imobiliare ${search.label}: ${search.url}`);
      const listings = await crawlImobiliare(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Crawler a eșuat:", err);
  process.exit(1);
});
