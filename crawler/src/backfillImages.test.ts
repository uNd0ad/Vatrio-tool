import assert from "node:assert/strict";
import test from "node:test";

// backfillImages.ts importă db.ts, care aruncă la import fără credențiale; în CI
// pasul de teste nu primește secretele (ca dedup/archive.test.ts).
process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-key";
const { extractOgImage, isUsableImage, extractHomezzPhoto } = await import("./backfillImages");

test("extractOgImage reads og:image in either attribute order", () => {
  assert.equal(
    extractOgImage('<meta property="og:image" content="https://cdn/photo.jpg">'),
    "https://cdn/photo.jpg"
  );
  assert.equal(
    extractOgImage('<meta content="https://cdn/photo.jpg" property="og:image"/>'),
    "https://cdn/photo.jpg"
  );
  assert.equal(extractOgImage("<html><head></head></html>"), null);
});

test("isUsableImage keeps real photos and rejects portal placeholders", () => {
  assert.equal(isUsableImage("https://frankfurt.apollo.olxcdn.com/v1/files/abc.jpg"), true);
  assert.equal(isUsableImage("https://ireland.apollo.olxcdn.com/v1/files/xyz"), true);

  // Placeholderele reale întâlnite pe portaluri: siglă SVG, imagine implicită.
  assert.equal(isUsableImage("https://homezz.ro/build/assets/homezz-logo-f7cb6974.svg"), false);
  assert.equal(isUsableImage("https://assets.imobiliare.ro/theme/imo/assets/default-og-image.png"), false);
  assert.equal(isUsableImage("https://olx.ro/app/static/media/no_thumbnail.svg"), false);
  assert.equal(isUsableImage(null), false);
  assert.equal(isUsableImage("/relative/path.jpg"), false);
});

test("extractHomezzPhoto picks the real /media/ photo, ignoring slider icons", () => {
  const html = `
    <img class="slider-btn prev" src="https://homezz.ro/build/assets/slider-arrow-left-efd5c69f.svg">
    <img class="slider-card" src="https://homezz.ro/media/2026-05/4174018/4174018_2.jpg">
    <img class="slider-card" src="https://homezz.ro/media/2026-05/4174018/4174018_1.jpg">
    <img src="https://homezz.ro/build/assets/heart-0b56e97f.svg">`;
  // Ia prima fotografie (_1), nu săgeata SVG, nu iconița heart.
  assert.equal(
    extractHomezzPhoto(html),
    "https://homezz.ro/media/2026-05/4174018/4174018_1.jpg"
  );
});

test("extractHomezzPhoto returns null when the page has no media photo", () => {
  assert.equal(extractHomezzPhoto('<img src="https://homezz.ro/build/assets/logo.svg">'), null);
});
