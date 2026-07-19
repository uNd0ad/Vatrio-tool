import assert from "node:assert/strict";
import test from "node:test";
import { isPathAllowed, parseRobotsTxt, RobotsDisallowedError, RobotsGuard } from "./robots";

test("uses the crawler-specific robots group and longest matching rule", () => {
  const policy = parseRobotsTxt(`
User-agent: *
Disallow: /
User-agent: VatrioCrawler
Disallow: /private
Allow: /private/public
Crawl-delay: 2
`);
  assert.equal(isPathAllowed("/listings", policy), true);
  assert.equal(isPathAllowed("/private/data", policy), false);
  assert.equal(isPathAllowed("/private/public/42", policy), true);
  assert.equal(policy.crawlDelayMs, 2000);
});

test("blocks disallowed URLs and honors the per-origin crawl delay", async () => {
  let now = 1000;
  const delays: number[] = [];
  const guard = new RobotsGuard({
    fetchImpl: async () => new Response("User-agent: *\nDisallow: /blocked\nCrawl-delay: 2"),
    minDelayMs: 500,
    now: () => now,
    sleep: async (delay) => { delays.push(delay); now += delay; },
  });
  await guard.beforeNavigate("https://example.test/allowed");
  now += 250;
  await guard.beforeNavigate("https://example.test/another");
  assert.deepEqual(delays, [1750]);
  await assert.rejects(() => guard.beforeNavigate("https://example.test/blocked"), RobotsDisallowedError);
});
