/**
 * Normalizare de text pentru potrivirile parserului.
 *
 * Portalurile scriu aceeași zonă în zeci de feluri ("Complexul Studențesc",
 * "complex studentesc", "zona-studentesc"), deci toate comparațiile se fac pe
 * o formă pliată: minuscule, fără diacritice, fără punctuație.
 */
export function foldText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    // Diacriticele românești (ș, ț, ă, â, î) devin literă + semn combinat după
    // NFD; semnul se aruncă, litera de bază rămâne.
    .replace(/[\u0300-\u036f]/g, "")
    // Orice altceva decât litere/cifre devine spațiu, ca "zona-fabric" și
    // "zona, Fabric" să se potrivească la fel.
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Tipar cu graniță de cuvânt pentru o expresie deja pliată. Fără granițe,
 * "fabric" s-ar potrivi în "fabricii" și "giroc" în "girocului" — adrese de
 * stradă și comune vecine ar fi citite drept cartiere.
 */
export function phrasePattern(foldedPhrase: string): RegExp {
  return new RegExp(`\\b${foldedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
}

export function containsPhrase(foldedText: string, foldedPhrase: string): boolean {
  if (!foldedText || !foldedPhrase) return false;
  return phrasePattern(foldedPhrase).test(foldedText);
}

/** Segmentele unei locații de portal ("Timișoara, zona Fabric" → 2 segmente). */
export function foldedSegments(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;|]/)
    .map((segment) => foldText(segment))
    .filter((segment) => segment.length > 0);
}

// Sufixele de prospețime ("- Reactualizat la 16 iulie 2026") și marcajele
// promoționale ajung în titlu la fel ca în locație și strică atât afișarea, cât
// și deduplicarea pe titlu.
const TITLE_NOISE: RegExp[] = [
  /\s+-\s+(reactualizat|actualizat|refresh(?:at)?)\b.*$/i,
  /\s+-\s+(azi|ieri|\d{1,2}\s+[a-zăâîșț]+\s+\d{4}).*$/i,
  /\bcomision\s*0\s*%?\b/gi,
  /\b0\s*%?\s*comision\b/gi,
];

/**
 * Curăță titlul brut: taie sufixele de portal, marcajele de tip "Comision 0%",
 * emoji-urile decorative și spațiile duplicate. Dacă rămâne gol, păstrăm
 * titlul original — un titlu lipsă e mai rău decât unul zgomotos.
 */
export function cleanTitle(title: string | null | undefined): string {
  if (!title) return "";
  let cleaned = title;
  for (const pattern of TITLE_NOISE) cleaned = cleaned.replace(pattern, " ");
  cleaned = cleaned
    // Emoji și simboluri decorative folosite de agenții ca să iasă în evidență.
    // Selectorul de variație se scoate separat: într-o clasă de caractere s-ar
    // combina cu caracterul dinaintea lui.
    .replace(/\u{FE0F}/gu, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{203C}]/gu, " ")
    .replace(/[!?]{2,}/g, "!")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;|/*.-]+|[\s,;|/*.-]+$/g, "")
    .trim();
  return cleaned || title.trim();
}
