import type { Page } from "playwright";
import type { RawListing } from "../db";

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
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  // Wait for at least one listing details link to render
  const linkSelector = 'a[href*="-vanzare-"], a[href*="-inchiriere-"], a[href*="/anunt/"]';
  await page.waitForSelector(linkSelector, { timeout: 15000 }).catch(async () => {
    const title = await page.title();
    console.warn(`[Imobiliare Scraper] Warning: No listing links matching selector "${linkSelector}" were found. Page Title: "${title}"`);
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
  const rawCards = await page.evaluate((type) => {
    const anchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    
    // Filter for listing details page links
    const listingLinks = anchors.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      if (href.endsWith("/timisoara") || href.endsWith("/inchirieri-apartamente") || href.endsWith("/vanzare-apartamente")) return false;
      return href.includes("/anunt/") || href.includes("-vanzare-") || href.includes("-inchiriere-") || /X[A-Z0-9]{8}/i.test(href);
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
      const cardEl = a.closest('.card-anunt, .container-anunt, [class*="card"], [class*="item"], [class*="container-anunt"], article, li, div.flex') || a.parentElement || a;
      
      const titleEl = cardEl.querySelector('h2, h3, [class*="titlu"], [class*="title"]');
      const priceEl = cardEl.querySelector('[class*="pret"], [class*="price"]');
      const locationEl = cardEl.querySelector('[class*="localizare"], [class*="zona"], [class*="locatie"]');
      const imgEl = cardEl.querySelector('img');

      let priceText = priceEl?.textContent?.trim() ?? "";
      if (!priceText) {
        const text = cardEl.textContent ?? "";
        const priceMatch = text.match(/(\d{1,3}(?:\.\d{3})*)\s*(?:€|eur|ron|lei)/i);
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
  }, transactionType);

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
      const currency = c.priceText.includes("€") || c.priceText.toLowerCase().includes("eur") ? ("EUR" as const) : ("RON" as const);

      // Parse surface sqm (e.g. "54 mp" or "62 m²")
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
      let seller: "owner" | "agency" | "developer" | "unknown" = "unknown";
      if (textLower.includes("proprietar") || textLower.includes("particular") || textLower.includes("persoană fizică") || textLower.includes("persoana fizica")) {
        seller = "owner";
      } else if (textLower.includes("dezvoltator")) {
        seller = "developer";
      } else if (textLower.includes("agenți") || textLower.includes("imobiliare") || textLower.includes("comision") || textLower.includes("reprezentare") || textLower.includes("agentie")) {
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
        source: "imobiliare" as const,
        seller_type: seller,
        transaction_type: transactionType,
      };
    });
}

function parsePrice(text: string): number | null {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}
