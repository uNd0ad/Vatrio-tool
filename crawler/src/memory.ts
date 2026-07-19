export interface MemorySample {
  label: string;
  rssMb: number;
  heapUsedMb: number;
  rssGrowthMb: number;
}

export class MemoryMonitor {
  private baselineRss: number | null = null;

  constructor(
    private readonly warningGrowthMb = Number(process.env.CRAWLER_MEMORY_GROWTH_MB ?? 256),
    private readonly memoryUsage: () => NodeJS.MemoryUsage = process.memoryUsage,
    private readonly warn: (message: string) => void = console.warn
  ) {
    if (!Number.isFinite(warningGrowthMb) || warningGrowthMb < 1) throw new RangeError("Memory warning threshold must be positive");
  }

  sample(label: string): MemorySample {
    const usage = this.memoryUsage();
    this.baselineRss ??= usage.rss;
    const sample = {
      label,
      rssMb: Math.round(usage.rss / 1_048_576),
      heapUsedMb: Math.round(usage.heapUsed / 1_048_576),
      rssGrowthMb: Math.round((usage.rss - this.baselineRss) / 1_048_576),
    };
    console.log(`[Memory] ${label}: RSS ${sample.rssMb} MB, heap ${sample.heapUsedMb} MB, growth ${sample.rssGrowthMb} MB`);
    if (sample.rssGrowthMb >= this.warningGrowthMb) {
      this.warn(`[Memory Alert] RSS grew by ${sample.rssGrowthMb} MB since crawler startup.`);
    }
    return sample;
  }
}

export const crawlerMemoryMonitor = new MemoryMonitor();
