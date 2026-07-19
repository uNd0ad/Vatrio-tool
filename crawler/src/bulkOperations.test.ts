import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("bulkOperations utility module exists and exports bulkUpdateStatus & bulkDeleteListings", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/bulkOperations.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function bulkUpdateStatus/);
  assert.match(code, /export function bulkDeleteListings/);
});
