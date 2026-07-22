import type { Page } from "playwright";
import type { RawListing } from "../db";
import { cardSelector } from "./selectors";
import { gotoWithRetry } from "../retry";
import { detectAndAlertAntiBot } from "../antiBot";
import { saveParseFailure } from "../parseFailure";
import { classifySellerType } from "../sellerType";
import { inferCurrency, parsePrice } from "../price";
import { normalizeLocation } from "../location";
import { inferTransactionType } from "../transactionType";
import { isPromotedListing } from "../promoted";
import { parseSurface } from "../surface";
import { isImobiliareListingCandidate } from "./imobiliareFilter";

/**
 * Playwright scraper for imobiliare.ro search pages.
 */
export async function crawlImobiliare(
  page: Page,
  searchUrl: string,
  transactionType: "sale" | "rent",
  defaultLocation = "Timișoara"
): Promise<RawListing[]> {
  // Navigate to target search url
  await gotoWithRetry(page, searchUrl);
  if (await detectAndAlertAntiBot(page, "Imobiliare", searchUrl)) return [];

  // Wait for at least one listing details link to render
  const cardsSelector = cardSelector("imobiliare");
  await page.waitForSelector(cardsSelector, { timeout: 15000 }).catch(async () => {
    const title = await page.title();
    console.warn(`[Imobiliare Scraper] Warning: No listing cards matching selectors "${cardsSelector}" were found. Page Title: "${title}"`);
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

  // Evaluate page to extract card-level data dynamically
  const rawCards = await page.evaluate(({ type, cardsSelector }) => {
    const anchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    
    // Filter for listing details page links.
    // Anunțurile stau azi pe /oferta/<slug>; slugul e "-de-vanzare-" sau
    // "-de-inchiriat-". Vechiul filtru căuta "-inchiriere-", care nu apare în
    // niciun URL real, deci chiriile erau eliminate toate, în tăcere.
    const listingLinks = anchors.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      if (!href) return false;
      // Paginile de căutare/categorie nu sunt anunțuri.
      if (/\/(vanzare|inchirieri)-[a-z]+(\/|$|\?)/i.test(href)) return false;
      return (
        href.includes("/oferta/") ||
        href.includes("/anunt/") ||
        /-de-(vanzare|inchiriat)-/i.test(href) ||
        /X[A-Z0-9]{8}/i.test(href)
      );
    });

    // Deduplicate by href
    const uniqueLinks: HTMLAnchorElement[] = [];
    const seen = new Set<string>();
    for (const a of listingLinks) {
      const href = a.getAttribute("href") ?? "";
      if (!seen.has(href)) {
        seen.add(href);
        uniqueLinks.push(a);
      }
    }

    return uniqueLinks.map((a) => {
      // Find the card container (anchor or parent elements)
      const cardEl = a.closest(cardsSelector) || a.parentElement || a;
      
      const titleEl = cardEl.querySelector('h2, h3, [class*="titlu"], [class*="title"]');
      const priceEl = cardEl.querySelector('[class*="pret"], [class*="price"]');
      const locationEl = cardEl.querySelector('[class*="localizare"], [class*="zona"], [class*="locatie"]');
      const imgEl = cardEl.querySelector('img');

      let priceText = priceEl?.textContent?.trim() ?? "";
      if (!priceText) {
        const text = cardEl.textContent ?? "";
        const priceMatch = text.match(/(\d{1,3}(?:\.\d{3})*|\d+)\s*(?:€|eur|ron|lei)/i);
        if (priceMatch) {
          priceText = priceMatch[0];
        }
      }

      return {
        title: titleEl?.textContent?.trim() || a.textContent?.trim() || "Apartament",
        href: a.getAttribute("href") ?? "",
        priceText,
        locationText: locationEl?.textContent?.trim() ?? "",
        imageUrl: imgEl?.getAttribute("src") ?? imgEl?.getAttribute("data-src") ?? imgEl?.getAttribute("data-original") ?? null,
        cardText: cardEl.textContent ?? "",
      };
    });
  }, { type: transactionType, cardsSelector });
  if (rawCards.length === 0) await saveParseFailure(page, "Imobiliare", searchUrl);

  return rawCards
    .filter((c) => {
      if (!isImobiliareListingCandidate(c)) return false;
      if (isPromotedListing(c.cardText)) return false;
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
        textLower.includes("ansamblu nou") ||
        titleLower.includes("proiect nou") ||
        titleLower.includes("ansamblu") ||
        titleLower.includes("complex rezidențial") ||
        titleLower.includes("complex rezidential");
      return !isNewProject;
    })
    .map((c) => {
      const fullUrl = c.href.startsWith("http")
        ? c.href
        : `https://www.imobiliare.ro${c.href}`;

      const priceVal = parsePrice(c.priceText);
      const currency = inferCurrency(c.priceText);

      const surface = parseSurface(c.cardText);

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
        source: "imobiliare" as const,
        seller_type: seller,
        transaction_type: inferTransactionType(c.title, transactionType),
      };
    });
}
