import type { Page } from "playwright";
import type { RawListing } from "../db";
import { cardSelector } from "./selectors";
import { gotoWithRetry } from "../retry";
import { detectAndAlertAntiBot } from "../antiBot";
import { saveParseFailure } from "../parseFailure";
import { inferCurrency, parsePrice } from "../price";
import { normalizeLocation } from "../location";

/**
 * NOTĂ IMPORTANTĂ:
 * Selectorii CSS de mai jos sunt un PUNCT DE PORNIRE, nu garantați corecți.
 * OLX își schimbă des marcajul HTML (class names generate/hashed), așa că
 * primul lucru de făcut e să deschizi o pagină de căutare OLX în browser,
 * inspectezi elementul unui card de anunț (right-click → Inspect) și
 * actualizezi selectorii aici înainte de prima rulare reală.
 *
 * Folosește `npx playwright codegen https://www.olx.ro/...` ca să generezi
 * selectori corecți interactiv, e mult mai rapid decât inspectarea manuală.
 */

export async function crawlOlx(
  page: Page,
  searchUrl: string,
  transactionType: "sale" | "rent",
  defaultLocation = "Timișoara"
): Promise<RawListing[]> {
  await page.addInitScript(() => {
    let capturedState: unknown;
    Object.defineProperty(window, "__PRERENDERED_STATE__", {
      configurable: true,
      get: () => capturedState,
      set: (value) => {
        capturedState = value;
        (window as Window & { __VATRIO_OLX_STATE__?: unknown }).__VATRIO_OLX_STATE__ = value;
      },
    });
  });
  await gotoWithRetry(page, searchUrl, "networkidle");
  if (await detectAndAlertAntiBot(page, "OLX", searchUrl)) return [];

  // Așteaptă să se încarce cardurile de anunțuri
  const cardsSelector = cardSelector("olx");
  await page.waitForSelector(cardsSelector, { timeout: 15000 }).catch(() => {
    console.warn(`Nu am găsit carduri OLX cu selectorii: ${cardsSelector}`);
  });

  // OLX pune `no_thumbnail.svg` pe cardurile din afara viewportului și încarcă
  // fotografia reală doar când cardul ajunge aproape de ecran.
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const sellerTypes = await page.evaluate(() => {
    const runtimeWindow = window as Window & {
      __PRERENDERED_STATE__?: string;
      __VATRIO_OLX_STATE__?: string;
    };
    let serialized = runtimeWindow.__VATRIO_OLX_STATE__ ?? runtimeWindow.__PRERENDERED_STATE__;
    if (!serialized) {
      const script = Array.from(document.scripts).find((item) =>
        item.textContent?.includes("window.__PRERENDERED_STATE__")
      )?.textContent;
      const encoded = script?.match(/__PRERENDERED_STATE__\s*=\s*("(?:\\.|[^"\\])*")/s)?.[1];
      if (encoded) {
        try { serialized = JSON.parse(encoded) as string; } catch { /* invalid SSR state */ }
      }
    }
    if (!serialized) return [] as Array<{ url: string; isBusiness: boolean }>;
    try {
      const state = JSON.parse(serialized) as {
        listing?: { listing?: { ads?: Array<{ url?: string; externalUrl?: string; isBusiness?: boolean }> } };
      };
      return (state.listing?.listing?.ads ?? [])
        .filter((ad) => ad.externalUrl || ad.url)
        .map((ad) => ({
          url: ad.externalUrl ?? ad.url!,
          isBusiness: ad.isBusiness === true,
        }));
    } catch {
      return [] as Array<{ url: string; isBusiness: boolean }>;
    }
  });
  const sellerTypeByUrl = new Map(
    sellerTypes.map((item) => [normalizeUrl(item.url), item.isBusiness ? "agency" as const : "owner" as const])
  );

  const rawCards = await page.$$eval(cardsSelector, (cards) =>
    cards.map((card) => {
      const titleEl = card.querySelector('h6, h4, [data-cy="ad-card-title"]');
      const priceEl = card.querySelector('[data-testid="ad-price"]');
      const locationEl = card.querySelector('[data-testid="location-date"]');
      const linkEl = card.querySelector("a");
      const imgEl = card.querySelector('img:not([src*="no_thumbnail"])');

      return {
        title: titleEl?.textContent?.trim() ?? "",
        priceText: priceEl?.textContent?.trim() ?? "",
        locationText: locationEl?.textContent?.trim() ?? "",
        href: linkEl?.getAttribute("href") ?? "",
        imageUrl:
          imgEl?.getAttribute("src") ??
          imgEl?.getAttribute("data-src") ??
          imgEl?.getAttribute("srcset")?.split(",").at(-1)?.trim().split(" ")[0] ??
          null,
      };
    })
  );
  if (rawCards.length === 0) await saveParseFailure(page, "OLX", searchUrl);

  const matchedSellerTypes = rawCards.filter((card) => sellerTypeByUrl.has(normalizeUrl(
    card.href.startsWith("http") ? card.href : `https://www.olx.ro${card.href}`
  ))).length;
  console.log(`Date OLX vânzători: ${sellerTypes.length} în SSR, ${matchedSellerTypes} potrivite cu cardurile.`);

  return rawCards
    .filter((c) => c.title && c.href)
    .map((c) => {
      const fullUrl = c.href.startsWith("http")
        ? c.href
        : `https://www.olx.ro${c.href}`;
      const isStoria = fullUrl.includes("storia.ro");

      return {
        title: c.title,
        price: parsePrice(c.priceText),
        currency: inferCurrency(c.priceText),
        location: normalizeLocation(c.locationText, defaultLocation),
        property_type: null,
        surface_sqm: null,
        image_url: c.imageUrl?.startsWith("http") ? c.imageUrl : null,
        listing_url: fullUrl,
        source: (isStoria ? "storia" : "olx") as "storia" | "olx",
        seller_type: sellerTypeByUrl.get(normalizeUrl(fullUrl)) ?? "unknown",
        transaction_type: transactionType,
      };
    });
}

function normalizeUrl(value: string) {
  return value.replace(/\/$/, "");
}
