export interface CrawlResult {
  site: string;
  searchLabel: string;
  searchUrl: string;
  resultCount: number;
}

export interface AlertOptions {
  webhookUrl?: string;
  fetchImpl?: typeof fetch;
  warn?: (message: string) => void;
}

export async function sendCrawlerAlert(message: string, options: AlertOptions = {}): Promise<boolean> {
  const warn = options.warn ?? console.warn;
  const webhookUrl = options.webhookUrl ?? process.env.CRAWLER_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    warn(`${message} (set CRAWLER_ALERT_WEBHOOK_URL to send this alert to Slack)`);
    return false;
  }
  try {
    const response = await (options.fetchImpl ?? fetch)(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!response.ok) {
      warn(`${message} (webhook responded with HTTP ${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    warn(`${message} (webhook delivery failed: ${detail})`);
    return false;
  }
}

export async function alertOnZeroResults(
  result: CrawlResult,
  options: AlertOptions = {}
): Promise<boolean> {
  if (result.resultCount > 0) return false;

  const message = `[Crawler Alert] ${result.site} ${result.searchLabel} returned 0 results: ${result.searchUrl}`;
  return sendCrawlerAlert(message, options);
}
