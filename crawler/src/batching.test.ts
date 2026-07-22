import assert from "node:assert/strict";
import test from "node:test";
import { chunkByEncodedLength, collectInBatches, MAX_FILTER_CHARS } from "./batching";

/** URL realist de OLX: lung, cu query string care se codifică. */
function olxUrl(index: number): string {
  return `https://www.olx.ro/d/oferta/proprietar-inchiriez-garsoniera-in-zona-complexului-studentesc-timisoara-ID${String(index).padStart(6, "k")}.html?search_reason=search%7Cpromoted`;
}

test("keeps every batch under the encoded-length budget", () => {
  const urls = Array.from({ length: 900 }, (_, i) => olxUrl(i));
  const batches = chunkByEncodedLength(urls);

  for (const batch of batches) {
    const encoded = batch.reduce((sum, url) => sum + encodeURIComponent(url).length + 6, 0);
    assert.ok(
      encoded <= MAX_FILTER_CHARS,
      `un lot a ajuns la ${encoded} caractere, peste bugetul de ${MAX_FILTER_CHARS}`
    );
  }
  // Regresie pentru UND_ERR_HEADERS_OVERFLOW: 200 de astfel de URL-uri însemnau
  // ~23.000 de caractere într-o singură cerere, respinsă de server.
  assert.ok(batches[0].length < 200, `primul lot are ${batches[0].length} valori, prea multe`);
});

test("loses no value and preserves order", () => {
  const urls = Array.from({ length: 500 }, (_, i) => olxUrl(i));
  const flattened = chunkByEncodedLength(urls).flat();
  assert.equal(flattened.length, urls.length);
  assert.deepEqual(flattened, urls);
});

test("returns no batches for an empty input", () => {
  assert.deepEqual(chunkByEncodedLength([]), []);
});

test("puts a single oversized value in its own batch instead of dropping it", () => {
  const huge = "https://example.com/" + "x".repeat(MAX_FILTER_CHARS * 2);
  const batches = chunkByEncodedLength(["https://example.com/a", huge, "https://example.com/b"]);
  assert.equal(batches.flat().length, 3);
  assert.deepEqual(batches.find((b) => b.includes(huge)), [huge]);
});

test("respects the value-count cap even for very short values", () => {
  const shortValues = Array.from({ length: 400 }, (_, i) => `u${i}`);
  for (const batch of chunkByEncodedLength(shortValues)) {
    assert.ok(batch.length <= 150, `lot cu ${batch.length} valori, peste plafon`);
  }
});

test("collectInBatches concatenates results from every batch", async () => {
  const urls = Array.from({ length: 300 }, (_, i) => olxUrl(i));
  const seen: number[] = [];
  const result = await collectInBatches(urls, async (batch) => {
    seen.push(batch.length);
    return batch.map((url) => ({ url }));
  });
  assert.equal(result.length, urls.length);
  assert.ok(seen.length > 1, "URL-urile ar fi trebuit împărțite în mai multe loturi");
});
