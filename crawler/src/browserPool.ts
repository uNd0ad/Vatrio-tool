import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { applyStealthScripts, getRandomUserAgent, getRealisticHeaders } from "./stealth";

interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface CrawlerBrowserSession {
  browser: Browser;
  pageFor: (site: string) => Promise<Page>;
  close: () => Promise<void>;
}

export async function createCrawlerBrowserSession(proxy?: ProxyConfig): Promise<CrawlerBrowserSession> {
  const browser = await chromium.launch({
    headless: true,
    proxy,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
    ],
  });
  const sitePages = new Map<string, { context: BrowserContext; page: Page }>();
  const pageFor = async (site: string): Promise<Page> => {
    const existing = sitePages.get(site);
    if (existing && !existing.page.isClosed()) return existing.page;
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1366, height: 768 },
      locale: "ro-RO",
      timezoneId: "Europe/Bucharest",
      extraHTTPHeaders: getRealisticHeaders(),
    });
    await applyStealthScripts(context);
    const page = await context.newPage();
    sitePages.set(site, { context, page });
    return page;
  };
  return { browser, pageFor, close: () => browser.close() };
}
