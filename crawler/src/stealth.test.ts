import assert from "node:assert/strict";
import test from "node:test";
import { getProxyConfig, getRandomUserAgent, getRealisticHeaders, humanDelay, USER_AGENTS } from "./stealth";

test("user-agent selection rotates across the configured pool", () => {
  assert.equal(getRandomUserAgent(() => 0), USER_AGENTS[0]);
  assert.equal(getRandomUserAgent(() => 0.999), USER_AGENTS.at(-1));
  assert.ok(USER_AGENTS.length >= 4);
});

test("context headers stay valid for every request type, not just navigation", () => {
  const headers = getRealisticHeaders();
  assert.match(headers["Accept-Language"], /^ro-RO/);

  // `extraHTTPHeaders` se aplică pe context, deci și cererilor de imagini.
  // Antetele de navigare le făceau contradictorii, CDN-ul le respingea, iar OLX
  // înlocuia poza cu `no_thumbnail` — 5 poze din 50 în loc de 50.
  for (const header of ["Sec-Fetch-Dest", "Sec-Fetch-Mode", "Sec-Fetch-Site", "Sec-Fetch-User", "Upgrade-Insecure-Requests"]) {
    assert.equal(headers[header], undefined, `${header} nu are ce căuta pe toate cererile`);
  }
});

test("human delay randomizes within inclusive bounds", async () => {
  const delays: number[] = [];
  const page = { waitForTimeout: async (delay: number) => { delays.push(delay); } };
  await humanDelay(page, 1200, 3000, () => 0);
  await humanDelay(page, 1200, 3000, () => 0.999999);
  assert.deepEqual(delays, [1200, 3000]);
});

test("human delay rejects invalid ranges", async () => {
  await assert.rejects(humanDelay({ waitForTimeout: async () => {} }, 10, 5), RangeError);
});

test("rotates and parses authenticated proxies", () => {
  const list = "http://first.test:8080,http://user:secret@second.test:9090";
  assert.deepEqual(getProxyConfig(list, () => 0), { server: "http://first.test:8080", username: undefined, password: undefined });
  assert.deepEqual(getProxyConfig(list, () => 0.999), { server: "http://second.test:9090", username: "user", password: "secret" });
});
