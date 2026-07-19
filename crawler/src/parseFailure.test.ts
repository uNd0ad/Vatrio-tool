import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { saveParseFailure } from "./parseFailure";

test("stores raw HTML with crawl metadata on parse failure", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "vatrio-parse-failure-"));
  let screenshotPath = "";
  const path = await saveParseFailure(
    {
      content: async () => "<html><body>changed layout</body></html>",
      screenshot: async (options) => {
        screenshotPath = String(options?.path);
        return Buffer.from("png");
      },
    },
    "Storia",
    "https://example.test/search",
    { outputDir, now: () => new Date("2026-07-19T10:20:30.000Z") }
  );
  assert.match(path, /2026-07-19T10-20-30-000Z-storia\.html$/);
  const stored = await readFile(path, "utf8");
  assert.match(stored, /https:\/\/example\.test\/search/);
  assert.match(stored, /changed layout/);
  assert.equal(screenshotPath, path.replace(/\.html$/, ".png"));
});
