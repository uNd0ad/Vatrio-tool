import type { Page } from "playwright";
import { sendCrawlerAlert } from "./alerts";

const CHALLENGE_TERMS = [
  "captcha",
  "verify you are human",
  "verifică dacă ești om",
  "access denied",
  "just a moment",
  "unusual traffic",
];

const GEO_BLOCK_TERMS = [
  "not available in your country",
  "not available in your region",
  "content is unavailable in your location",
  "service is not available in your country",
  "acest conținut nu este disponibil în țara",
  "serviciul nu este disponibil în regiunea",
];

export function isGeoBlockedContent(title: string, bodyText: string): boolean {
  const content = `${title} ${bodyText}`.toLowerCase();
  return GEO_BLOCK_TERMS.some((term) => content.includes(term));
}

export function isAntiBotContent(title: string, bodyText: string, hasChallengeElement: boolean): boolean {
  if (hasChallengeElement) return true;
  const content = `${title} ${bodyText}`.toLowerCase();
  return CHALLENGE_TERMS.some((term) => content.includes(term));
}

export async function detectAndAlertAntiBot(page: Page, site: string, url: string): Promise<boolean> {
  const state = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body?.innerText.slice(0, 5000) ?? "",
    hasChallengeElement: Boolean(document.querySelector(
      'iframe[src*="captcha"], .g-recaptcha, [data-sitekey], [id*="captcha"], [class*="captcha"], #challenge-running'
    )),
  }));
  if (isGeoBlockedContent(state.title, state.bodyText)) {
    await sendCrawlerAlert(`[Crawler Alert] ${site} is region-locked for the crawler location and was skipped: ${url}`);
    return true;
  }
  if (!isAntiBotContent(state.title, state.bodyText, state.hasChallengeElement)) return false;
  await sendCrawlerAlert(`[Crawler Alert] ${site} returned a CAPTCHA/anti-bot challenge and was skipped: ${url}`);
  return true;
}
