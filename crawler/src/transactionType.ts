export type TransactionType = "sale" | "rent";

/**
 * Normalizes raw transaction string into standard "sale" | "rent".
 */
export function normalizeTransactionType(
  raw: string | null | undefined,
  fallback: TransactionType = "sale"
): TransactionType {
  if (!raw || typeof raw !== "string") return fallback;
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalized) return fallback;

  if (
    /\b(inchiriere|inchiriat|inchiriez|chirie|rent|for-rent|for rent|to rent)\b/i.test(normalized) ||
    normalized.includes("inchiriat") ||
    normalized.includes("inchiriere") ||
    normalized.includes("chirie")
  ) {
    return "rent";
  }

  if (
    /\b(vanzare|vand|se vinde|sale|for-sale|for sale|to buy|cumparare)\b/i.test(normalized) ||
    normalized.includes("vanzare") ||
    normalized.includes("vinde")
  ) {
    return "sale";
  }

  return fallback;
}

/**
 * Infers transaction type from URL path/query or title string with fallback.
 */
export function inferTransactionType(
  urlOrTitle: string | null | undefined,
  fallback: TransactionType = "sale"
): TransactionType {
  if (!urlOrTitle) return fallback;
  const normalized = urlOrTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // `inchiriat` prins explicit: slugurile imobiliare.ro sunt "-de-inchiriat-",
  // deci varianta cu spațiu ("de inchiriat") nu se potrivea.
  if (/\b(de inchiriat|inchiriat|inchiriere|inchiriez|chirie|for-rent|rent)\b/i.test(normalized)) {
    return "rent";
  }
  if (/\b(de vanzare|vanzare|vand|se vinde|for-sale|sale)\b/i.test(normalized)) {
    return "sale";
  }

  return normalizeTransactionType(urlOrTitle, fallback);
}
