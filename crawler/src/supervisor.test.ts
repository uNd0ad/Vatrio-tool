import assert from "node:assert/strict";
import test from "node:test";
import { restartDelay } from "./supervisor";

test("supervisor uses bounded exponential restart delays", () => {
  assert.deepEqual([1, 2, 3, 8].map((attempt) => restartDelay(attempt, 1000, 5000)), [1000, 2000, 4000, 5000]);
  assert.throws(() => restartDelay(0), RangeError);
});
