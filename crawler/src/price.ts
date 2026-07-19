export type SupportedCurrency = "EUR" | "RON" | "USD" | "GBP";

const EXCHANGE_RATES_TO_EUR: Record<SupportedCurrency, number> = {
  EUR: 1.0,
  RON: 0.20,
  USD: 0.92,
  GBP: 1.18,
};

export function parsePrice(text: string): number | null {
  const match = text.replace(/\s/g, "").match(/\d[\d.,]*/)?.[0];
  if (!match) return null;
  const separator = Math.max(match.lastIndexOf(","), match.lastIndexOf("."));
  const digitsAfter = separator >= 0 ? match.length - separator - 1 : 0;
  const hasDecimalSuffix = digitsAfter > 0 && digitsAfter <= 2;
  const normalized = hasDecimalSuffix
    ? `${match.slice(0, separator).replace(/[^\d]/g, "")}.${match.slice(separator + 1).replace(/[^\d]/g, "")}`
    : match.replace(/[^\d]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function inferCurrency(text: string): SupportedCurrency | null {
  if (!text || typeof text !== "string") return null;
  const normalized = text.toLowerCase();
  if (normalized.includes("€") || /\b(eur|euro)\b/.test(normalized)) return "EUR";
  if (/\b(ron|lei|leu)\b/.test(normalized)) return "RON";
  if (normalized.includes("$") || /\b(usd|dollar|dolari)\b/.test(normalized)) return "USD";
  if (normalized.includes("£") || /\b(gbp|pound|lire)\b/.test(normalized)) return "GBP";
  return null;
}

export function normalizeCurrency(
  textOrCurrency: string | null | undefined,
  defaultCurrency: SupportedCurrency = "EUR"
): SupportedCurrency {
  if (!textOrCurrency) return defaultCurrency;
  const inferred = inferCurrency(textOrCurrency);
  if (inferred) return inferred;
  const upper = textOrCurrency.trim().toUpperCase();
  if (upper in EXCHANGE_RATES_TO_EUR) return upper as SupportedCurrency;
  return defaultCurrency;
}

export function convertCurrency(
  amount: number | null | undefined,
  fromCurrency: SupportedCurrency = "EUR",
  toCurrency: SupportedCurrency = "EUR"
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  if (fromCurrency === toCurrency) return amount;
  const fromRate = EXCHANGE_RATES_TO_EUR[fromCurrency] ?? 1.0;
  const toRate = EXCHANGE_RATES_TO_EUR[toCurrency] ?? 1.0;
  const amountInEur = amount * fromRate;
  const converted = amountInEur / toRate;
  return Math.round(converted * 100) / 100;
}
