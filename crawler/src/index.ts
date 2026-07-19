import { chromium } from "playwright";
import { upsertListings } from "./db";
import { crawlOlx } from "./sites/olx";
import { crawlImobiliare } from "./sites/imobiliare";
import { crawlStoria } from "./sites/storia";
import { crawlHomezz } from "./sites/homezz";
import { crawlPubli24 } from "./sites/publi24";
import { detectAndLinkDuplicates } from "./dedup";
import { getProxyConfig, applyStealthScripts, getRandomUserAgent, humanDelay } from "./stealth";

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

const STORIA_SEARCHES = [
  {
    url: "https://www.storia.ro/ro/rezultate/vanzare/apartament/timis/timisoara",
    transactionType: "sale" as const,
    label: "vânzare",
  },
  {
    url: "https://www.storia.ro/ro/rezultate/inchiriere/apartament/timis/timisoara",
    transactionType: "rent" as const,
    label: "chirie",
  },
];

const HOMEZZ_SEARCHES = [
  {
    url: "https://homezz.ro/anunturi_apartamente_de-vanzare_timisoara_timis.html",
    transactionType: "sale" as const,
    label: "vânzare",
  },
  {
    url: "https://homezz.ro/anunturi_apartamente_de-inchiriat_timisoara_timis.html",
    transactionType: "rent" as const,
    label: "chirie",
  },
];

const PUBLI24_SEARCHES = [
  {
    url: "https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/timis/timisoara/",
    transactionType: "sale" as const,
    label: "vânzare",
  },
  {
    url: "https://www.publi24.ro/anunturi/imobiliare/de-inchiriat/apartamente/timis/timisoara/",
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
  const proxy = getProxyConfig();
  if (proxy) {
    console.log(`[Stealth/Proxy] Rulare prin server proxy: ${proxy.server}`);
  }

  const browser = await chromium.launch({
    headless: true,
    proxy,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
    ]
  });
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1366, height: 768 },
    locale: "ro-RO",
    timezoneId: "Europe/Bucharest"
  });
  await applyStealthScripts(context);

  const page = await context.newPage();

  try {
    if (OLX_SEARCHES.length > 0) {
      await validateSelectors(page, OLX_SEARCHES[0].url);
    }
    for (const search of OLX_SEARCHES) {
      await humanDelay(page);
      console.log(`Crawl OLX ${search.label}: ${search.url}`);
      const listings = await crawlOlx(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }

    for (const search of IMOBILIARE_SEARCHES) {
      await humanDelay(page);
      console.log(`Crawl Imobiliare ${search.label}: ${search.url}`);
      const listings = await crawlImobiliare(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }

    for (const search of STORIA_SEARCHES) {
      await humanDelay(page);
      console.log(`Crawl Storia ${search.label}: ${search.url}`);
      const listings = await crawlStoria(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }

    for (const search of HOMEZZ_SEARCHES) {
      await humanDelay(page);
      console.log(`Crawl HomeZZ ${search.label}: ${search.url}`);
      const listings = await crawlHomezz(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }

    for (const search of PUBLI24_SEARCHES) {
      await humanDelay(page);
      console.log(`Crawl Publi24 ${search.label}: ${search.url}`);
      const listings = await crawlPubli24(page, search.url, search.transactionType);
      const owners = listings.filter((listing) => listing.seller_type === "owner").length;
      const agencies = listings.filter((listing) => listing.seller_type === "agency").length;
      const unknown = listings.length - owners - agencies;
      console.log(`Găsite ${listings.length}: ${owners} proprietari, ${agencies} agenții, ${unknown} necunoscute.`);
      await upsertListings(listings);
    }



    console.log("Rulare algoritm deduplicare...");
    await detectAndLinkDuplicates();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Crawler a eșuat:", err);
  process.exit(1);
});
