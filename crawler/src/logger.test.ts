import assert from "node:assert/strict";
import test from "node:test";
import { CrawlLogger } from "./logger";

test("writes structured JSON with stable run metadata", () => {
  const lines: string[] = [];
  const logger = new CrawlLogger("run-1", (line) => lines.push(line), () => new Date("2026-07-19T12:00:00Z"));
  logger.log("site_completed", { site: "olx", listing_count: 12 });
  assert.deepEqual(JSON.parse(lines[0]), {
    timestamp: "2026-07-19T12:00:00.000Z", run_id: "run-1", event: "site_completed", site: "olx", listing_count: 12,
  });
});
