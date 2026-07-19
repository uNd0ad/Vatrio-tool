import type { Page } from "playwright";
import type { RawListing } from "../db";

/**
 * Playwright scraper for homezz.ro search pages.
 */
export async function crawlHomezz(
  page: Page,
  searchUrl: string,
  transactionType: "sale" | "rent",
  defaultLocation = "Timișoara"
): Promise<RawListing[]> {
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  const selector = 'a[href*="-anunt-"], a[href*="homezz.ro/"], [class*="anunt"], article';
  await page.waitForSelector(selector, { timeout: 15000 }).catch(async () => {
    const title = await page.title();
    console.warn(`[HomeZZ Scraper] Warning: No listing elements matching selector "${selector}" were found. Page Title: "${title}"`);
  });

  // Scroll to trigger lazy loading
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const rawCards = await page.evaluate(() => {
    const cardElements = Array.from(
      document.querySelectorAll('[class*="anunt"], [class*="item"], article, div[id*="anunt"]')
    );

    return cardElements.map((card) => {
      const linkEl = card.querySelector('a[href*="-anunt-"], a[href*="html"]') || card.querySelector('a[href]');
      const titleEl = card.querySelector('h2, h3, [class*="titlu"], [class*="title"]');
      const priceEl = card.querySelector('[class*="pret"], [class*="price"]');
      const locationEl = card.querySelector('[class*="locatie"], [class*="location"], [class*="zona"]');
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
  });

  return rawCards
    .filter((c) => {
      if (!c.title || !c.href) return false;
      const textLower = c.cardText.toLowerCase();
      const isNewProject = textLower.includes("proiect nou") || textLower.includes("ansamblu rezidential");
      return !isNewProject;
    })
    .map((c) => {
      const fullUrl = c.href.startsWith("http")
        ? c.href
        : `https://homezz.ro${c.href.startsWith("/") ? "" : "/"}${c.href}`;

      const priceVal = parsePrice(c.priceText);
      const currency = c.priceText.includes("€") || c.priceText.toLowerCase().includes("eur") ? ("EUR" as const) : ("RON" as const);

      const sqmMatch = c.cardText.match(/(\d+(?:[.,]\d+)?)\s*(?:mp|m²)/i);
      let surface: number | null = null;
      if (sqmMatch) {
        surface = parseFloat(sqmMatch[1].replace(",", "."));
      }

      const textLower = c.cardText.toLowerCase();
      let propType: string | null = null;
      if (textLower.includes("garsonier")) propType = "Garsonieră";
      else if (textLower.includes("casă") || textLower.includes("vilă") || textLower.includes("casa")) propType = "Casă";
      else if (textLower.includes("apartament")) propType = "Apartament";
      else if (textLower.includes("teren")) propType = "Teren";

      let seller: "owner" | "agency" | "developer" | "unknown" = "unknown";
      if (textLower.includes("proprietar") || textLower.includes("particular") || textLower.includes("persoana fizica")) {
        seller = "owner";
      } else if (textLower.includes("dezvoltator")) {
        seller = "developer";
      } else if (textLower.includes("agentie") || textLower.includes("imobiliare")) {
        seller = "agency";
      }

      return {
        title: c.title,
        price: priceVal,
        currency,
        location: c.locationText || defaultLocation,
        property_type: propType,
        surface_sqm: surface,
        image_url: c.imageUrl?.startsWith("http") ? c.imageUrl : null,
        listing_url: fullUrl,
        source: "homezz" as const,
        seller_type: seller,
        transaction_type: transactionType,
      };
    });
}

function parsePrice(text: string): number | null {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}
