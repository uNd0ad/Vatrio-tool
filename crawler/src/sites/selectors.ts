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
  // Atenție: `cardSelector` unește lista într-un singur selector, deci variantele
  // sunt o reuniune, nu o listă de rezerve în ordine. Un tipar larg ca
  // `[class*="item"]` prindea elementele de meniu ("Contul meu", "Adaugă anunț")
  // și le salva ca anunțuri, așa că variantele trebuie să rămână strânse și să
  // nu se poată potrivi cu interiorul altui card.
  homezz: [
    // Cardul e chiar ancora; copiii sunt div/p, deci restrângerea la <a> e sigură.
    'a.card-box',
    'a[class*="card-box"]',
  ],
  publi24: [
    '.article-item',
    'div[class*="article-item"]',
  ],
} as const;

export type CrawlerSite = keyof typeof SITE_CARD_SELECTORS;

export function cardSelector(site: CrawlerSite): string {
  return SITE_CARD_SELECTORS[site].join(", ");
}
