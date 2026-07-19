import assert from "node:assert/strict";
import test from "node:test";
import { enabledSites, isSiteEnabled } from "./siteConfig";

test("all sites are enabled by default", () => {
  assert.equal(enabledSites(undefined).size, 5);
});

test("allows an explicit site subset and rejects typos", () => {
  assert.equal(isSiteEnabled("olx", "olx,storia"), true);
  assert.equal(isSiteEnabled("publi24", "olx,storia"), false);
  assert.throws(() => enabledSites("olx,unknown"), /Unknown crawler site/);
});
