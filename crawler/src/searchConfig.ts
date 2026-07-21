import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { CrawlerSite } from "./sites/selectors";

export interface SearchTarget {
  url: string;
  transactionType: "sale" | "rent";
  label: string;
}

export type SiteSearches = Record<CrawlerSite, SearchTarget[]>;

// Căutările implicite (Timișoara). Pentru alte orașe/filtre NU modifica codul:
// creează crawler/searches.json (vezi searches.example.json) sau setează
// CRAWLER_SEARCHES_PATH către un JSON cu aceeași structură.
export const DEFAULT_SEARCHES: SiteSearches = {
  olx: [
    {
      url: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-vanzare/timisoara/",
      transactionType: "sale",
      label: "vânzare",
    },
    {
      url: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-inchiriat/timisoara/",
      transactionType: "rent",
      label: "chirie",
    },
  ],
  imobiliare: [
    {
      url: "https://www.imobiliare.ro/vanzare-apartamente/timisoara",
      transactionType: "sale",
      label: "vânzare",
    },
    {
      url: "https://www.imobiliare.ro/inchirieri-apartamente/timisoara",
      transactionType: "rent",
      label: "chirie",
    },
  ],
  storia: [
    {
      url: "https://www.storia.ro/ro/rezultate/vanzare/apartament/timis/timisoara",
      transactionType: "sale",
      label: "vânzare",
    },
    {
      url: "https://www.storia.ro/ro/rezultate/inchiriere/apartament/timis/timisoara",
      transactionType: "rent",
      label: "chirie",
    },
  ],
  homezz: [
    {
      url: "https://homezz.ro/anunturi_apartamente_de-vanzare_timisoara_timis.html",
      transactionType: "sale",
      label: "vânzare",
    },
    {
      url: "https://homezz.ro/anunturi_apartamente_de-inchiriat_timisoara_timis.html",
      transactionType: "rent",
      label: "chirie",
    },
  ],
  publi24: [
    {
      url: "https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/timis/timisoara/",
      transactionType: "sale",
      label: "vânzare",
    },
    {
      url: "https://www.publi24.ro/anunturi/imobiliare/de-inchiriat/apartamente/timis/timisoara/",
      transactionType: "rent",
      label: "chirie",
    },
  ],
};

const SITES: CrawlerSite[] = ["olx", "imobiliare", "storia", "homezz", "publi24"];

function isValidTarget(value: unknown): value is SearchTarget {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.url === "string" &&
    /^https?:\/\//.test(t.url) &&
    (t.transactionType === "sale" || t.transactionType === "rent") &&
    typeof t.label === "string" &&
    t.label.length > 0
  );
}

export function parseSearchConfig(raw: string, sourceName = "searches.json"): SiteSearches {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${sourceName} nu este JSON valid: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${sourceName} trebuie să fie un obiect { site: [ căutări ] }.`);
  }
  const config = { ...DEFAULT_SEARCHES };
  for (const [site, targets] of Object.entries(parsed as Record<string, unknown>)) {
    if (!SITES.includes(site as CrawlerSite)) {
      throw new Error(`${sourceName}: site necunoscut "${site}" (valide: ${SITES.join(", ")}).`);
    }
    if (!Array.isArray(targets) || !targets.every(isValidTarget)) {
      throw new Error(
        `${sourceName}: căutările pentru "${site}" trebuie să fie o listă de obiecte {url, transactionType: "sale"|"rent", label}.`
      );
    }
    config[site as CrawlerSite] = targets as SearchTarget[];
  }
  return config;
}

/**
 * Încarcă configurația de căutări: CRAWLER_SEARCHES_PATH > crawler/searches.json
 * > valorile implicite din cod. O configurație prezentă dar invalidă oprește
 * rularea cu un mesaj clar, în loc să continue silențios pe alte URL-uri.
 */
export function loadSearchConfig(cwd = process.cwd()): SiteSearches {
  const explicitPath = process.env.CRAWLER_SEARCHES_PATH;
  const candidate = explicitPath ?? path.join(cwd, "searches.json");
  if (!existsSync(candidate)) {
    if (explicitPath) {
      throw new Error(`CRAWLER_SEARCHES_PATH indică un fișier inexistent: ${explicitPath}`);
    }
    return DEFAULT_SEARCHES;
  }
  const raw = readFileSync(candidate, "utf-8");
  const config = parseSearchConfig(raw, path.basename(candidate));
  console.log(`[Search Config] Căutări încărcate din ${candidate}.`);
  return config;
}
