import assert from "node:assert/strict";
import test from "node:test";
import { pingHeartbeat } from "./heartbeat";

test("sends success and failure heartbeat URLs", async () => {
  const urls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    urls.push(String(input));
    return new Response(null, { status: 200 });
  };
  assert.equal(await pingHeartbeat("success", { heartbeatUrl: "https://health.test/id", fetchImpl }), true);
  assert.equal(await pingHeartbeat("fail", { heartbeatUrl: "https://health.test/id/", fetchImpl }), true);
  assert.deepEqual(urls, ["https://health.test/id", "https://health.test/id/fail"]);
});

test("is a no-op when no heartbeat is configured", async () => {
  assert.equal(await pingHeartbeat("success", { heartbeatUrl: "" }), false);
});
