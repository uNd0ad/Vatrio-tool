import assert from "node:assert/strict";
import test from "node:test";
import { CircuitOpenError, SiteCircuitBreaker } from "./circuitBreaker";

test("opens per-site circuit after consecutive failures and recovers after cooldown", async () => {
  let now = 1000;
  const breaker = new SiteCircuitBreaker(2, 500, () => now);
  const fail = async () => { throw new Error("down"); };
  await assert.rejects(breaker.execute("olx", fail), /down/);
  await assert.rejects(breaker.execute("olx", fail), /down/);
  await assert.rejects(breaker.execute("olx", async () => "ok"), CircuitOpenError);
  assert.equal(await breaker.execute("storia", async () => "ok"), "ok");
  now += 500;
  assert.equal(await breaker.execute("olx", async () => "recovered"), "recovered");
});
