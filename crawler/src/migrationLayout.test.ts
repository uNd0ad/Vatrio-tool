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
    "20260719001700_listing_coordinates.sql",
    "20260719001800_supabase_backup_schedule.sql",
    "20260719001900_auto_archive_inactive_listings.sql",
    "20260719002000_currency_multi_currency_support.sql",
    "20260719002100_foreign_key_cascade_review.sql",
    "20260719002200_dashboard_views.sql",
    "20260719002300_listings_partitioning_strategy.sql",
    "20260719002400_listing_status_enum.sql",
    "20260719002500_listing_price_check_constraint.sql",
    "20260719002600_auto_update_updated_at_trigger.sql",
    "20260719002700_listing_photos_table.sql",
    "20260719002800_listing_crawl_source_tracking.sql",
    "20260719002900_listing_snapshots_table.sql",
    "20260719003000_unique_source_external_id_constraint.sql",
    "20260719003100_column_comments_self_documentation.sql",
    "20260719003200_archived_listings_table.sql",
    "20260719003300_configurable_data_retention_policy.sql",
    "20260719003400_client_matches_table.sql",
    "20260719003500_notes_history_table.sql",
    "20260719003600_pgcrypto_encryption_support.sql",
  ]);
  assert.equal(new Set(files.map((file) => file.slice(0, 14))).size, files.length);
  const config = await readFile(new URL("../../supabase/config.toml", import.meta.url), "utf8");
  assert.match(config, /project_id = "vatrio-tool"/);
});
