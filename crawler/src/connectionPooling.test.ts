import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { evaluatePoolingConfig } from "../../scripts/check-connection-pooling.mjs";

test("POOLING_GUIDE.md exists and check-connection-pooling validates port settings", () => {
  const guidePath = path.resolve(process.cwd(), "../docs/POOLING_GUIDE.md");
  const markdown = readFileSync(guidePath, "utf-8");
  assert.match(markdown, /Database Connection Pooling Guide/);
  assert.match(markdown, /pgBouncer/);

  const pooledConfig = evaluatePoolingConfig({ DB_PORT: "6543" });
  assert.equal(pooledConfig.status, "OPTIMAL");
  assert.equal(pooledConfig.recommendedMaxConnections, 25);
});
