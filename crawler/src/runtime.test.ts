import assert from "node:assert/strict";
import test from "node:test";
import { isDryRun } from "./runtime";

test("detects CLI and environment dry-run settings", () => {
  assert.equal(isDryRun(["--dry-run"], undefined), true);
  assert.equal(isDryRun([], "true"), true);
  assert.equal(isDryRun([], "1"), true);
  assert.equal(isDryRun([], "false"), false);
});
