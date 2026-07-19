import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("theme utility module exists and exports getPreferredTheme and applyTheme", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/theme.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function getPreferredTheme/);
  assert.match(code, /export function applyTheme/);
  assert.match(code, /data-theme/);
});
