import assert from "node:assert/strict";
import test from "node:test";
import { cardSelector, SITE_CARD_SELECTORS } from "./selectors";

test("each crawler site has unique, non-empty card selectors", () => {
  // `cardSelector` unește variantele într-un singur selector, deci ele sunt o
  // reuniune, nu o listă de rezerve. Un număr mare de variante nu e o calitate:
  // tiparele largi prindeau meniul site-ului ca anunțuri. Cerem doar să existe
  // și să fie distincte.
  for (const [site, selectors] of Object.entries(SITE_CARD_SELECTORS)) {
    assert.ok(selectors.length >= 1, `${site} must have at least one selector`);
    assert.equal(new Set(selectors).size, selectors.length, `${site} selectors must be unique`);
    assert.equal(cardSelector(site as keyof typeof SITE_CARD_SELECTORS), selectors.join(", "));
  }
});

test("OLX retains its stable data attribute as the primary selector", () => {
  assert.equal(SITE_CARD_SELECTORS.olx[0], '[data-cy="l-card"]');
});
