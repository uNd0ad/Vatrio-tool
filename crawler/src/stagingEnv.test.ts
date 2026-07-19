import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseConfig } from "../../scripts/staging-env.mjs";

test("getSupabaseConfig distinguishes between production and staging environments", () => {
  const prodConfig = getSupabaseConfig({ APP_ENV: "production", SUPABASE_URL: "https://prod.supabase.co" });
  assert.equal(prodConfig.environment, "production");
  assert.equal(prodConfig.url, "https://prod.supabase.co");

  const stagingConfig = getSupabaseConfig({ APP_ENV: "staging", STAGING_SUPABASE_URL: "https://staging.supabase.co" });
  assert.equal(stagingConfig.environment, "staging");
  assert.equal(stagingConfig.url, "https://staging.supabase.co");
});
