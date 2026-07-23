import assert from "node:assert/strict";
import test from "node:test";
import { extractOgImage, isUsableImage } from "./backfillImages";

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
