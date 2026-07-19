import assert from "node:assert/strict";
import test from "node:test";
import { isAntiBotContent, isGeoBlockedContent } from "./antiBot";

test("detects common CAPTCHA and challenge pages", () => {
  assert.equal(isAntiBotContent("Just a moment...", "Checking your browser", false), true);
  assert.equal(isAntiBotContent("Search", "Listings", true), true);
  assert.equal(isAntiBotContent("Search", "12 apartamente în Timișoara", false), false);
});

test("detects English and Romanian region-locked pages", () => {
  assert.equal(isGeoBlockedContent("Unavailable", "This service is not available in your country."), true);
  assert.equal(isGeoBlockedContent("Indisponibil", "Acest conținut nu este disponibil în țara dvs."), true);
  assert.equal(isGeoBlockedContent("Apartamente", "Anunțuri disponibile în toată țara"), false);
});
