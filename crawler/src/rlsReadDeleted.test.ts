import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("RLS migration lets authenticated users read soft-deleted listings", () => {
  const sql = readFileSync(
    path.resolve(process.cwd(), "../supabase/migrations/20260723000200_rls_read_deleted_listings.sql"),
    "utf-8"
  );
  // Politica îngustă „doar active" e înlocuită cu una care permite citirea
  // tuturor rândurilor — altfel coșul de gunoi rămâne mereu gol pentru
  // utilizatorii reali (service_role ignoră RLS, de-aia scăpase la verificare).
  assert.match(sql, /drop policy if exists listings_authenticated_read_active/);
  assert.match(sql, /create policy listings_authenticated_read_all\s+on public\.listings for select to authenticated\s+using \(true\)/);
});
