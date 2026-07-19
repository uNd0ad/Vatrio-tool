import assert from "node:assert/strict";
import test from "node:test";
import { withExponentialBackoff } from "./retry";

test("retries failures with exponential delays", async () => {
  let attempts = 0;
  const delays: number[] = [];
  const result = await withExponentialBackoff(
    async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary");
      return "ok";
    },
    { baseDelayMs: 100, sleep: async (delay) => { delays.push(delay); } }
  );
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [100, 200]);
});

test("throws the last error after the maximum attempts", async () => {
  const expected = new Error("still down");
  await assert.rejects(
    withExponentialBackoff(async () => { throw expected; }, { maxAttempts: 2, sleep: async () => {} }),
    expected
  );
});
