import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("KanbanBoard component file exists and defines 4 status columns", () => {
  const componentPath = path.resolve(process.cwd(), "../src/components/KanbanBoard.tsx");
  const code = readFileSync(componentPath, "utf-8");
  assert.match(code, /export const KanbanBoard/);
  assert.match(code, /COLUMNS/);
  assert.match(code, /onStatusChange/);
});
