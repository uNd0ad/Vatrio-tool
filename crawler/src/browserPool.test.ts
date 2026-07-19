import assert from "node:assert/strict";
import test from "node:test";
import { createCrawlerBrowserSession } from "./browserPool";

test("crawler browser session reuses pages per site and isolates site contexts", async () => {
  const session = await createCrawlerBrowserSession();
  try {
    const olxPage = await session.pageFor("olx");
    assert.equal(await session.pageFor("olx"), olxPage);
    await olxPage.setContent("<h1>OLX</h1>");
    const storiaPage = await session.pageFor("storia");
    await storiaPage.setContent("<h1>Storia</h1>");
    assert.notEqual(storiaPage.context(), olxPage.context());
    assert.equal(await storiaPage.locator("h1").textContent(), "Storia");
    assert.equal(session.browser.contexts().length, 2);
  } finally {
    await session.close();
  }
});
