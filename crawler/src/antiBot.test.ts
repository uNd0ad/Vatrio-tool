import assert from "node:assert/strict";
import test from "node:test";
import { isAntiBotContent } from "./antiBot";

test("detects common CAPTCHA and challenge pages", () => {
  assert.equal(isAntiBotContent("Just a moment...", "Checking your browser", false), true);
  assert.equal(isAntiBotContent("Search", "Listings", true), true);
  assert.equal(isAntiBotContent("Search", "12 apartamente în Timișoara", false), false);
});
