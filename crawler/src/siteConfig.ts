import type { CrawlerSite } from "./sites/selectors";

const ALL_SITES: readonly CrawlerSite[] = ["olx", "storia", "imobiliare", "homezz", "publi24"];

export function enabledSites(value = process.env.CRAWLER_ENABLED_SITES): ReadonlySet<CrawlerSite> {
  if (!value?.trim()) return new Set(ALL_SITES);
  const configured = value.split(",").map((site) => site.trim().toLowerCase()).filter(Boolean);
  const invalid = configured.filter((site) => !ALL_SITES.includes(site as CrawlerSite));
  if (invalid.length > 0) throw new Error(`Unknown crawler site(s): ${invalid.join(", ")}`);
  return new Set(configured as CrawlerSite[]);
}

export function isSiteEnabled(site: CrawlerSite, value = process.env.CRAWLER_ENABLED_SITES): boolean {
  return enabledSites(value).has(site);
}
