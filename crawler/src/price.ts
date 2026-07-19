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

export function inferCurrency(text: string): "EUR" | "RON" | null {
  const normalized = text.toLowerCase();
  if (normalized.includes("€") || /\beur\b/.test(normalized)) return "EUR";
  if (/\b(ron|lei|leu)\b/.test(normalized)) return "RON";
  return null;
}
