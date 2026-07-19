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
  if (!isAntiBotContent(state.title, state.bodyText, state.hasChallengeElement)) return false;
  await sendCrawlerAlert(`[Crawler Alert] ${site} returned a CAPTCHA/anti-bot challenge and was skipped: ${url}`);
  return true;
}
