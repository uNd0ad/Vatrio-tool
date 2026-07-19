export class CircuitOpenError extends Error {
  constructor(public readonly site: string, public readonly retryAt: number) {
    super(`Circuit for ${site} is open until ${new Date(retryAt).toISOString()}`);
    this.name = "CircuitOpenError";
  }
}

interface CircuitState { failures: number; openUntil: number; }

export class SiteCircuitBreaker {
  private readonly states = new Map<string, CircuitState>();

  constructor(
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 15 * 60_000,
    private readonly now: () => number = Date.now
  ) {
    if (!Number.isInteger(failureThreshold) || failureThreshold < 1) throw new RangeError("failureThreshold must be a positive integer");
    if (!Number.isFinite(cooldownMs) || cooldownMs < 0) throw new RangeError("cooldownMs must be non-negative");
  }

  async execute<T>(site: string, operation: () => Promise<T>): Promise<T> {
    const state = this.states.get(site) ?? { failures: 0, openUntil: 0 };
    if (state.openUntil > this.now()) throw new CircuitOpenError(site, state.openUntil);
    try {
      const result = await operation();
      this.states.delete(site);
      return result;
    } catch (error) {
      const failures = state.failures + 1;
      this.states.set(site, {
        failures,
        openUntil: failures >= this.failureThreshold ? this.now() + this.cooldownMs : 0,
      });
      throw error;
    }
  }
}

export const crawlerCircuitBreaker = new SiteCircuitBreaker(
  Number.parseInt(process.env.CRAWLER_CIRCUIT_FAILURES ?? "3", 10),
  Number.parseInt(process.env.CRAWLER_CIRCUIT_COOLDOWN_MS ?? "900000", 10)
);
