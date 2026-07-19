import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("MapView component file exists and defines zone filtering and point projection", () => {
  const componentPath = path.resolve(process.cwd(), "../src/components/MapView.tsx");
  const code = readFileSync(componentPath, "utf-8");
  assert.match(code, /export const MapView/);
  assert.match(code, /activeZoneFilter/);
  assert.match(code, /projectPoint/);
});
