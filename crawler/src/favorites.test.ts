import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("favorites utility module exists and exports getStarredListingIds, toggleStarredListing, isListingStarred", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/favorites.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function getStarredListingIds/);
  assert.match(code, /export function toggleStarredListing/);
  assert.match(code, /export function isListingStarred/);
});
