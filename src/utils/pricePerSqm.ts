/**
 * Calculates price per square meter (€/m²), returning null if either value is invalid.
 */
export function calculatePricePerSqm(price: number | null, sqm: number | null): number | null {
  if (price === null || sqm === null || sqm <= 0 || price <= 0) {
    return null;
  }
  return Math.round(price / sqm);
}

/**
 * Formats the calculated price per square meter for Romanian locale display.
 */
export function formatPricePerSqm(
  price: number | null,
  sqm: number | null,
  currency: string | null = 'EUR'
): string {
  const rate = calculatePricePerSqm(price, sqm);
  if (rate === null) return '';
  const curr = currency ?? 'EUR';
  return `${new Intl.NumberFormat('ro-RO').format(rate)} ${curr}/m²`;
}
