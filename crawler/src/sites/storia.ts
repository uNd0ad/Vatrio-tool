import type { Page } from "playwright";
import type { RawListing } from "../db";
import { cardSelector } from "./selectors";
import { gotoWithRetry } from "../retry";
import { detectAndAlertAntiBot } from "../antiBot";
import { saveParseFailure } from "../parseFailure";
import { classifySellerType } from "../sellerType";
import { inferCurrency, parsePrice } from "../price";
import { normalizeLocation } from "../location";

/**
 * Playwright scraper for storia.ro search pages.
 */
export async function crawlStoria(
  page: Page,
  searchUrl: string,
  transactionType: "sale" | "rent",
  defaultLocation = "Timișoara"
): Promise<RawListing[]> {
  // Navigate to target search url
  await gotoWithRetry(page, searchUrl);
  if (await detectAndAlertAntiBot(page, "Storia", searchUrl)) return [];

  // Wait for listing links or item cards to render
  const selector = cardSelector("storia");
  await page.waitForSelector(selector, { timeout: 15000 }).catch(async () => {
    const title = await page.title();
    console.warn(`[Storia Scraper] Warning: No listing elements matching selector "${selector}" were found. Page Title: "${title}"`);
  });

  // Scroll page to trigger lazy loading of images
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  // Evaluate page to extract card data
  const rawCards = await page.evaluate(({ type, selector }) => {
    const cardElements = Array.from(
      document.querySelectorAll(selector)
    );

    return cardElements.map((card) => {
      const linkEl = card.querySelector('a[href*="/ro/oferta/"]') || card.querySelector('a[href]');
      const titleEl = card.querySelector('p[class*="title"], h3, h2, [data-cy="listing-item-title"]');
      const priceEl = card.querySelector('[data-cy="listing-item-price"], span[class*="price"]');
      const locationEl = card.querySelector('p[class*="location"], [class*="location"], span[class*="address"]');
      const imgEl = card.querySelector('img');

      let priceText = priceEl?.textContent?.trim() ?? "";
      if (!priceText) {
        const text = card.textContent ?? "";
        const priceMatch = text.match(/(\d{1,3}(?:\.\d{3})*|\d+)\s*(?:€|eur|ron|lei)/i);
        if (priceMatch) {
          priceText = priceMatch[0];
        }
      }

      return {
        title: titleEl?.textContent?.trim() || linkEl?.textContent?.trim() || "Apartament",
        href: linkEl?.getAttribute("href") ?? "",
        priceText,
        locationText: locationEl?.textContent?.trim() ?? "",
        imageUrl: imgEl?.getAttribute("src") ?? imgEl?.getAttribute("data-src") ?? null,
        cardText: card.textContent ?? "",
      };
    });
  }, { type: transactionType, selector });
  if (rawCards.length === 0) await saveParseFailure(page, "Storia", searchUrl);

  return rawCards
    .filter((c) => {
      if (!c.title || !c.href) return false;
      const textLower = c.cardText.toLowerCase();
      const titleLower = c.title.toLowerCase();
      const isNewProject = 
        textLower.includes("proiect nou") || 
        textLower.includes("proiect rezidențial") || 
        textLower.includes("proiect rezidential") || 
        textLower.includes("ansamblu rezidențial") || 
        textLower.includes("ansamblu rezidential") || 
        textLower.includes("complex rezidențial") || 
        textLower.includes("complex rezidential") ||
        titleLower.includes("ansamblu") ||
        titleLower.includes("complex");
      return !isNewProject;
    })
    .map((c) => {
      const fullUrl = c.href.startsWith("http")
        ? c.href
        : `https://www.storia.ro${c.href}`;

      const priceVal = parsePrice(c.priceText);
      const currency = inferCurrency(c.priceText);

      // Parse surface area in sqm
      const sqmMatch = c.cardText.match(/(\d+(?:[.,]\d+)?)\s*(?:mp|m²)/i);
      let surface: number | null = null;
      if (sqmMatch) {
        const cleaned = sqmMatch[1].replace(",", ".");
        surface = parseFloat(cleaned);
      }

      // Parse property type
      const textLower = c.cardText.toLowerCase();
      let propType: string | null = null;
      if (textLower.includes("garsonier")) {
        propType = "Garsonieră";
      } else if (textLower.includes("casă") || textLower.includes("vilă") || textLower.includes("casa")) {
        propType = "Casă";
      } else if (textLower.includes("apartament")) {
        propType = "Apartament";
      } else if (textLower.includes("teren")) {
        propType = "Teren";
      }

      // Parse seller type
      const seller = classifySellerType(c.cardText);

      return {
        title: c.title,
        price: priceVal,
        currency,
        location: normalizeLocation(c.locationText, defaultLocation),
        property_type: propType,
        surface_sqm: surface,
        image_url: c.imageUrl?.startsWith("http") ? c.imageUrl : null,
        listing_url: fullUrl,
        source: "storia" as const,
        seller_type: seller,
        transaction_type: transactionType,
      };
    });
}
