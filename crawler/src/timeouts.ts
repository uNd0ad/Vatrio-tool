import type { Page } from "playwright";
import type { QueueSite } from "./queue";

const SITES = new Set<QueueSite>(["olx", "storia", "imobiliare", "homezz", "publi24"]);

export function parseSiteTimeouts(value = process.env.CRAWLER_SITE_TIMEOUT_MS): Partial<Record<QueueSite, number>> {
  if (!value) return {};
  const timeouts: Partial<Record<QueueSite, number>> = {};
  for (const entry of value.split(",")) {
    const [rawSite, rawTimeout] = entry.split(":").map((part) => part.trim());
    const site = rawSite as QueueSite;
    const timeout = Number(rawTimeout);
    if (!SITES.has(site) || !Number.isInteger(timeout) || timeout < 1000) {
      throw new Error(`Invalid site timeout: ${entry}`);
    }
    timeouts[site] = timeout;
  }
  return timeouts;
}

export function applySiteTimeout(page: Page, site: QueueSite): number {
  const timeout = parseSiteTimeouts()[site] ?? 30_000;
  page.setDefaultNavigationTimeout(timeout);
  page.setDefaultTimeout(timeout);
  return timeout;
}
