/**
 * PostgREST trimite filtrele `.in(...)` în URL, iar serverul respinge cererea
 * când antetele depășesc ~16KB (UND_ERR_HEADERS_OVERFLOW). Împărțirea pe număr
 * fix de elemente nu e suficientă: URL-urile de anunțuri au lungimi foarte
 * diferite (cele de pe OLX ajung la ~150 de caractere, plus query string), deci
 * 200 de valori însemnau ~23.000 de caractere și cereri respinse.
 *
 * Loturile se taie deci după lungimea codificată, cu o rezervă confortabilă
 * față de limita reală, și cu o limită de siguranță pe număr.
 */
export const MAX_FILTER_CHARS = 6000;
export const MAX_FILTER_VALUES = 150;

/** Costul aproximativ al unei valori în filtru: valoarea codificată, ghilimele și virgulă. */
function encodedCost(value: string): number {
  return encodeURIComponent(value).length + 6;
}

export function chunkByEncodedLength(
  values: readonly string[],
  maxChars = MAX_FILTER_CHARS,
  maxValues = MAX_FILTER_VALUES
): string[][] {
  if (maxChars < 1 || maxValues < 1) throw new RangeError("maxChars și maxValues trebuie să fie pozitive");

  const batches: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;

  for (const value of values) {
    const cost = encodedCost(value);
    // O singură valoare peste buget pleacă în lotul ei: mai bine o cerere
    // riscantă decât să o pierdem tăcut din procesare.
    if (current.length > 0 && (currentChars + cost > maxChars || current.length >= maxValues)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(value);
    currentChars += cost;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Rulează `run` pe fiecare lot și concatenează rezultatele. Loturile merg
 * secvențial: scopul e să nu depășim limitele serverului, nu să-l inundăm.
 */
export async function collectInBatches<T>(
  values: readonly string[],
  run: (batch: string[]) => Promise<T[]>,
  maxChars = MAX_FILTER_CHARS
): Promise<T[]> {
  const results: T[] = [];
  for (const batch of chunkByEncodedLength(values, maxChars)) {
    results.push(...await run(batch));
  }
  return results;
}
