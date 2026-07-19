import assert from "node:assert/strict";
import test from "node:test";
import { emailCrawlSummary, summaryText, type CrawlSummary } from "./summary";

const summary: CrawlSummary = { parsed: 20, newListings: 5, seenListings: 15, staleFlagged: 2, mode: "static" };

test("formats and sends a crawl summary email", async () => {
  let body = "";
  const sent = await emailCrawlSummary(summary, {
    apiKey: "key", to: "owner@example.test", from: "crawler@example.test",
    fetchImpl: async (_url, init) => { body = String(init?.body); return new Response(null, { status: 200 }); },
  });
  assert.equal(sent, true);
  assert.match(summaryText(summary), /New: 5/);
  assert.equal(JSON.parse(body).subject, "Vatrio crawl: 5 new listings");
});

test("skips email when configuration is incomplete", async () => {
  assert.equal(await emailCrawlSummary(summary, { apiKey: "", to: "", from: "" }), false);
});
