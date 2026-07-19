import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("notifications utility module exists and exports requestNotificationPermission and sendDesktopNotification", () => {
  const utilPath = path.resolve(process.cwd(), "../src/utils/notifications.ts");
  const code = readFileSync(utilPath, "utf-8");
  assert.match(code, /export async function requestNotificationPermission/);
  assert.match(code, /export function sendDesktopNotification/);
});
