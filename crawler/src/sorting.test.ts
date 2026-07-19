import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("sorting utility module exists and exports sortListings function", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/sorting.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function sortListings/);
  assert.match(code, /localeCompare/);
});
