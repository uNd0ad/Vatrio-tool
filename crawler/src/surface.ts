/**
 * Extrage suprafața utilă (m²) din textul unui card de anunț.
 *
 * Publi24 scrie unitatea ca `m<sup>2</sup>`, deci `textContent` produce "m2",
 * nu "m²" — varianta veche a tiparului rata jumătate din anunțuri. Sunt
 * acceptate și "mp", și scrierea cu virgulă zecimală ("49,5 mp").
 */
// `\b` se aplică doar variantelor alfanumerice: după `²`, care nu e caracter de
// cuvânt, o graniță de cuvânt nu se poate forma, iar tiparul nu s-ar potrivi
// niciodată cu "52 m² |".
const SURFACE_PATTERN = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:m²|(?:mp|m2)\b)/i;

// Sub 8 m² sau peste 2000 m² nu mai e o suprafață utilă de apartament: sunt
// aproape sigur alte numere din card (cod poștal, an, preț pe m²).
const MIN_SQM = 8;
const MAX_SQM = 2000;

export function parseSurface(cardText: string | null | undefined): number | null {
  if (!cardText) return null;
  const match = cardText.match(SURFACE_PATTERN);
  if (!match) return null;

  const value = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value < MIN_SQM || value > MAX_SQM) return null;
  return value;
}
