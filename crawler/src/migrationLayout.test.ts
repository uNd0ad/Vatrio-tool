import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

test("new database changes use ordered Supabase CLI migrations", async () => {
  const directory = new URL("../../supabase/migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  assert.deepEqual(files, [
    "20260719000700_listing_price_history.sql",
    "20260719000800_listing_days_on_market.sql",
    "20260719000900_listing_soft_delete.sql",
    "20260719001000_listing_full_text_search.sql",
    "20260719001100_explicit_row_level_security.sql",
    "20260719001200_listing_filter_indexes.sql",
    "20260719001300_listing_audit_log.sql",
    "20260719001400_listing_images_bucket.sql",
    "20260719001500_listing_notes.sql",
    "20260719001600_listing_tags.sql",
  ]);
  assert.equal(new Set(files.map((file) => file.slice(0, 14))).size, files.length);
  const config = await readFile(new URL("../../supabase/config.toml", import.meta.url), "utf8");
  assert.match(config, /project_id = "vatrio-tool"/);
});
