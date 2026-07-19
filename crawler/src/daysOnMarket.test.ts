import assert from "node:assert/strict";
import test from "node:test";
import { calculateDaysOnMarket } from "../../src/utils/daysOnMarket";

test("calculates whole non-negative days on market", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");
  assert.equal(calculateDaysOnMarket("2026-07-17T11:59:59.000Z", now), 2);
  assert.equal(calculateDaysOnMarket("2026-07-20T12:00:00.000Z", now), 0);
  assert.equal(calculateDaysOnMarket("invalid", now), 0);
});
