const CANONICAL_NAMES: Array<[RegExp, string]> = [
  [/\btimisoara\b/gi, "Timișoara"],
  [/\btimis\b/gi, "Timiș"],
  [/\bcircumvalatiunii\b/gi, "Circumvalațiunii"],
  [/\bcalea sagului\b/gi, "Calea Șagului"],
  [/\bcomplex studentesc\b/gi, "Complex Studențesc"],
];

export function normalizeLocation(value: string | null | undefined, fallback: string): string {
  let normalized = value?.trim() || fallback;
  normalized = normalized
    // Sufixele de prospețime ale portalurilor ("- Reactualizat la 16 iulie
    // 2026", "- azi", "- 14 iulie 2026") ajung în câmpul de locație și ar fi
    // tratate ca zone distincte de hartă și de analiză.
    .replace(/\s+-\s+(reactualizat|actualizat|refresh(?:at)?)\b.*$/i, "")
    .replace(/\s+-\s+(azi|ieri|\d{1,2}\s+[a-zăâîșț]+).*$/i, "")
    .replace(/\s*[,|]\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/^(jud\.?\s*)/i, "")
    .trim();
  for (const [pattern, replacement] of CANONICAL_NAMES) normalized = normalized.replace(pattern, replacement);
  return normalized;
}
