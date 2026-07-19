import assert from "node:assert/strict";
import test from "node:test";
import { cardSelector, SITE_CARD_SELECTORS } from "./selectors";

test("each crawler site has ordered fallback card selectors", () => {
  for (const [site, selectors] of Object.entries(SITE_CARD_SELECTORS)) {
    assert.ok(selectors.length >= 3, `${site} must have at least two fallbacks`);
    assert.equal(new Set(selectors).size, selectors.length, `${site} selectors must be unique`);
    assert.equal(cardSelector(site as keyof typeof SITE_CARD_SELECTORS), selectors.join(", "));
  }
});

test("OLX retains its stable data attribute as the primary selector", () => {
  assert.equal(SITE_CARD_SELECTORS.olx[0], '[data-cy="l-card"]');
});
