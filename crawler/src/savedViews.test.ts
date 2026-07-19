import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("savedViews utility exports getSavedViews, saveView, deleteSavedView", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/savedViews.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function getSavedViews/);
  assert.match(code, /export function saveView/);
  assert.match(code, /export function deleteSavedView/);
});
