import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("keyboardShortcuts utility module exists and exports handleKeyboardShortcut", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/keyboardShortcuts.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export function handleKeyboardShortcut/);
  assert.match(code, /onSearch/);
  assert.match(code, /onSetStatus/);
});
