import assert from "node:assert/strict";
import test from "node:test";
import { MemoryMonitor } from "./memory";

test("tracks RSS growth and warns at the configured threshold", () => {
  const warnings: string[] = [];
  let rss = 100 * 1_048_576;
  const monitor = new MemoryMonitor(50, () => ({ rss, heapTotal: 0, heapUsed: 20 * 1_048_576, external: 0, arrayBuffers: 0 }), (message) => warnings.push(message));
  assert.equal(monitor.sample("start").rssGrowthMb, 0);
  rss += 60 * 1_048_576;
  assert.equal(monitor.sample("after-site").rssGrowthMb, 60);
  assert.equal(warnings.length, 1);
});
