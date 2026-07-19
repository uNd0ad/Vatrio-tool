export interface CrawlSummary {
  parsed: number;
  newListings: number;
  seenListings: number;
  staleFlagged: number;
  mode: "static" | "queue";
}

interface SummaryOptions {
  apiKey?: string;
  to?: string;
  from?: string;
  fetchImpl?: typeof fetch;
}

export function summaryText(summary: CrawlSummary): string {
  return [
    `Vatrio crawler summary (${summary.mode})`,
    `Parsed: ${summary.parsed}`,
    `New: ${summary.newListings}`,
    `Previously seen: ${summary.seenListings}`,
    `Newly flagged stale: ${summary.staleFlagged}`,
  ].join("\n");
}

export async function emailCrawlSummary(summary: CrawlSummary, options: SummaryOptions = {}): Promise<boolean> {
  const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
  const to = options.to ?? process.env.CRAWLER_SUMMARY_EMAIL_TO;
  const from = options.from ?? process.env.CRAWLER_SUMMARY_EMAIL_FROM;
  if (!apiKey || !to || !from) return false;
  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `Vatrio crawl: ${summary.newListings} new listings`, text: summaryText(summary) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`[Summary] Email provider returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[Summary] Email delivery failed: ${detail}`);
    return false;
  }
}
