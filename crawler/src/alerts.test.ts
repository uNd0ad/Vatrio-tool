import assert from "node:assert/strict";
import test from "node:test";
import { alertOnZeroResults } from "./alerts";

const zeroResult = {
  site: "OLX",
  searchLabel: "sale",
  searchUrl: "https://example.test/search",
  resultCount: 0,
};

test("does not send an alert when a crawl has results", async () => {
  let requests = 0;
  const sent = await alertOnZeroResults(
    { ...zeroResult, resultCount: 2 },
    {
      webhookUrl: "https://hooks.example.test",
      fetchImpl: async () => {
        requests += 1;
        return new Response(null, { status: 200 });
      },
    }
  );
  assert.equal(sent, false);
  assert.equal(requests, 0);
});

test("sends a Slack-compatible webhook payload for zero results", async () => {
  let payload = "";
  const sent = await alertOnZeroResults(zeroResult, {
    webhookUrl: "https://hooks.example.test",
    fetchImpl: async (_url, init) => {
      payload = String(init?.body);
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(sent, true);
  assert.match(JSON.parse(payload).text, /OLX sale returned 0 results/);
});

test("logs locally when no webhook is configured", async () => {
  const warnings: string[] = [];
  const sent = await alertOnZeroResults(zeroResult, {
    webhookUrl: "",
    warn: (message) => warnings.push(message),
  });
  assert.equal(sent, false);
  assert.match(warnings[0], /CRAWLER_ALERT_WEBHOOK_URL/);
});
