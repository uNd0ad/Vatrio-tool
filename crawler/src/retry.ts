import type { Page } from "playwright";
import { crawlerRobotsGuard } from "./robots";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0) {
    throw new RangeError("baseDelayMs must be a non-negative number");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw new Error("Retry loop exhausted unexpectedly");
}

export async function gotoWithRetry(
  page: Page,
  url: string,
  waitUntil: "domcontentloaded" | "networkidle" = "domcontentloaded"
): Promise<void> {
  await crawlerRobotsGuard.beforeNavigate(url);
  await withExponentialBackoff(
    async () => {
      await page.goto(url, { waitUntil });
    },
    {
      onRetry: (error, attempt, delayMs) => {
        const detail = error instanceof Error ? error.message : String(error);
        console.warn(`[Navigation] ${url} failed on attempt ${attempt}; retrying in ${delayMs}ms: ${detail}`);
      },
    }
  );
}
