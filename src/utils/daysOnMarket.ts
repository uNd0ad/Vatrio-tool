const MILLISECONDS_PER_DAY = 86_400_000;

export function calculateDaysOnMarket(dateScraped: string, now = new Date()): number {
  const scrapedAt = new Date(dateScraped);
  if (Number.isNaN(scrapedAt.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - scrapedAt.getTime()) / MILLISECONDS_PER_DAY));
}
