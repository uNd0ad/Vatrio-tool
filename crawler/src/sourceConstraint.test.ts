import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SITE_CARD_SELECTORS } from "./sites/selectors";

test("source constraint migration covers every portal the crawler visits", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260722000200_source_allow_all_portals.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  assert.match(sql, /drop constraint if exists listings_source_check/);

  const allowed = sql.match(/source in \(([^)]+)\)/)![1]
    .split(",")
    .map((value) => value.trim().replace(/'/g, ""));

  // Legătura care lipsea: adăugarea unui portal nou în cod fără a extinde
  // constrângerea oprea tot crawl-ul la primul anunț de pe acel portal.
  for (const site of Object.keys(SITE_CARD_SELECTORS)) {
    assert.ok(allowed.includes(site), `constrângerea nu permite sursa "${site}"`);
  }
  assert.equal(allowed.length, Object.keys(SITE_CARD_SELECTORS).length,
    "constrângerea și lista de portaluri trebuie să conțină exact aceleași valori");
});
