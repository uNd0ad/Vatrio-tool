import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("docs/DATA_DICTIONARY.md exists and documents core schema tables", () => {
  const dictPath = path.resolve(process.cwd(), "../docs/DATA_DICTIONARY.md");
  const markdown = readFileSync(dictPath, "utf-8");
  assert.match(markdown, /Data Dictionary & Database Schema Documentation/);
  assert.match(markdown, /public\.listings/);
  assert.match(markdown, /public\.listing_price_history/);
  assert.match(markdown, /public\.listing_photos/);
  assert.match(markdown, /public\.listing_snapshots/);
});
