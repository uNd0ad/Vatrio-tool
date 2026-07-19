import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteTimeouts } from "./timeouts";

test("parses and validates per-site timeouts", () => {
  assert.deepEqual(parseSiteTimeouts("olx:15000, storia:45000"), { olx: 15000, storia: 45000 });
  assert.throws(() => parseSiteTimeouts("olx:500"), /Invalid site timeout/);
  assert.throws(() => parseSiteTimeouts("unknown:5000"), /Invalid site timeout/);
});
