import { convertCurrency, normalizeCurrency } from "../price";
import type { TransactionType } from "../transactionType";
import { foldText } from "./text";

/** Numărul de camere scris cu cifră ("2 camere", "3cam", "2 cam."). */
const ROOMS_PATTERN = /\b(\d{1,2})\s*(?:camere|camera|cam)\b/;
/** Numărul de camere scris în litere, cum apare la garsoniere și la case. */
const ROOMS_IN_WORDS: Array<[RegExp, number]> = [
  [/\b(?:o|una)\s+camera\b/, 1],
  [/\bdoua\s+camere\b/, 2],
  [/\btrei\s+camere\b/, 3],
  [/\bpatru\s+camere\b/, 4],
  [/\bcinci\s+camere\b/, 5],
];

const MAX_ROOMS = 20;

/**
 * Deduce numărul de camere din titlu, apoi din restul textului.
 *
 * Titlul are prioritate pentru că acolo apare camera anunțului; textul cardului
 * mai conține și numere din alte contexte ("bloc cu 4 etaje", "2 balcoane").
 * Garsoniera e tratată explicit ca o cameră — portalurile nu scriu niciodată
 * "1 cameră" pentru ea.
 */
export function parseRooms(title: string | null | undefined, text?: string | null): number | null {
  for (const source of [title, text]) {
    const folded = foldText(source);
    if (!folded) continue;

    if (/\bgarsoniera\b|\bgarsoniere\b/.test(folded)) return 1;

    const digits = folded.match(ROOMS_PATTERN);
    if (digits) {
      const value = Number(digits[1]);
      if (value >= 1 && value <= MAX_ROOMS) return value;
    }

    for (const [pattern, value] of ROOMS_IN_WORDS) {
      if (pattern.test(folded)) return value;
    }
  }
  return null;
}

// Sub 8 m² sau peste 2000 m² nu mai e o suprafață utilă credibilă; aceleași
// limite ca la extragerea din text (`surface.ts`), aplicate și valorilor care
// vin deja parsate de la scraper.
const MIN_SQM = 8;
const MAX_SQM = 2000;

export function isPlausibleSurface(surface: number | null | undefined): boolean {
  return typeof surface === "number" && Number.isFinite(surface) && surface >= MIN_SQM && surface <= MAX_SQM;
}

/** Prețul scris pe metru pătrat ("1.450 €/mp") nu e prețul anunțului. */
const PRICE_PER_SQM_PATTERN = /(?:€|eur|euro|lei|ron|\$|usd)\s*\/\s*(?:mp|m²|m2)|\/\s*(?:mp|m²|m2)\b/i;

// Intervale plauzibile în EUR. Prețurile din afara lor rămân în bază, dar
// marcate: de obicei sunt prețuri pe m², chirii trecute ca vânzare sau anunțuri
// cu preț de tip "1 EUR — sunați pentru detalii".
const RENT_RANGE_EUR = { min: 50, max: 20_000 };
const SALE_RANGE_EUR = { min: 5_000, max: 5_000_000 };

export type PriceWarning = "price_missing" | "price_per_sqm" | "price_out_of_range";

export interface PriceCheck {
  price: number | null;
  warnings: PriceWarning[];
}

/**
 * Validează prețul adus de scraper.
 *
 * Singurul caz în care aruncăm valoarea e prețul pe metru pătrat citit din
 * greșeală ca preț total (sau un preț zero) — acolo valoarea e sigur falsă. Un
 * preț doar neobișnuit e păstrat și semnalat, ca să nu pierdem anunțuri reale
 * din piață.
 */
export function checkPrice(input: {
  price: number | null | undefined;
  currency: string | null | undefined;
  transactionType: TransactionType;
  priceText?: string | null;
}): PriceCheck {
  const { price, currency, transactionType, priceText } = input;

  if (priceText && PRICE_PER_SQM_PATTERN.test(priceText)) {
    return { price: null, warnings: ["price_per_sqm"] };
  }
  if (price == null || !Number.isFinite(price) || price <= 0) {
    return { price: null, warnings: ["price_missing"] };
  }

  const inEur = convertCurrency(price, normalizeCurrency(currency, "EUR"), "EUR") ?? price;
  const range = transactionType === "rent" ? RENT_RANGE_EUR : SALE_RANGE_EUR;
  if (inEur < range.min || inEur > range.max) {
    return { price, warnings: ["price_out_of_range"] };
  }
  return { price, warnings: [] };
}
