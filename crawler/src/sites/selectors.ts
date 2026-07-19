export const SITE_CARD_SELECTORS = {
  olx: [
    '[data-cy="l-card"]',
    '[data-testid="l-card"]',
    'article[data-testid="listing-grid-item"]',
  ],
  storia: [
    '[data-cy="listing-item"]',
    '[data-testid="listing-item"]',
    'article',
    'li[class*="listing"]',
  ],
  imobiliare: [
    '.card-anunt',
    '.container-anunt',
    '[data-testid="listing-card"]',
    'article',
    'li[class*="listing"]',
  ],
  homezz: [
    '[class*="anunt"]',
    '[class*="item"]',
    'article',
    'div[id*="anunt"]',
  ],
  publi24: [
    'article',
    '[class*="snippet"]',
    '[class*="card"]',
    'li[id*="ad_"]',
  ],
} as const;

export type CrawlerSite = keyof typeof SITE_CARD_SELECTORS;

export function cardSelector(site: CrawlerSite): string {
  return SITE_CARD_SELECTORS[site].join(", ");
}
