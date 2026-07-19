import { randomUUID } from "node:crypto";

export class CrawlLogger {
  constructor(
    readonly runId: string = randomUUID(),
    private readonly sink: (line: string) => void = console.log,
    private readonly now: () => Date = () => new Date()
  ) {}

  log(event: string, data: Record<string, unknown> = {}): void {
    this.sink(JSON.stringify({ timestamp: this.now().toISOString(), run_id: this.runId, event, ...data }));
  }
}

export const crawlLogger = new CrawlLogger();
