const USER_AGENT = "VatrioCrawler";

export interface RobotsPolicy {
  rules: Array<{ allow: boolean; path: string }>;
  crawlDelayMs: number;
}

export class RobotsDisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt disallows crawling ${url}`);
    this.name = "RobotsDisallowedError";
  }
}

export function parseRobotsTxt(text: string, userAgent = USER_AGENT): RobotsPolicy {
  const groups: Array<{ agents: string[]; rules: RobotsPolicy["rules"]; delay?: number }> = [];
  let current: (typeof groups)[number] | undefined;
  let hasDirective = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (!current || hasDirective) {
        current = { agents: [], rules: [] };
        groups.push(current);
        hasDirective = false;
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === "allow" || key === "disallow")) {
      hasDirective = true;
      if (value) current.rules.push({ allow: key === "allow", path: value });
    } else if (current && key === "crawl-delay") {
      hasDirective = true;
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds >= 0) current.delay = seconds * 1000;
    }
  }

  const normalizedAgent = userAgent.toLowerCase();
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== "*" && normalizedAgent.includes(agent)));
  const selected = specific.length > 0 ? specific : groups.filter((group) => group.agents.includes("*"));
  return {
    rules: selected.flatMap((group) => group.rules),
    crawlDelayMs: Math.max(0, ...selected.map((group) => group.delay ?? 0)),
  };
}

export function isPathAllowed(path: string, policy: RobotsPolicy): boolean {
  const matching = policy.rules
    .filter((rule) => path.startsWith(rule.path.replace(/\$$/, "")))
    .sort((left, right) => right.path.length - left.path.length);
  return matching[0]?.allow ?? true;
}

interface RobotsGuardOptions {
  fetchImpl?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
  now?: () => number;
  minDelayMs?: number;
}

export class RobotsGuard {
  private readonly policies = new Map<string, Promise<RobotsPolicy>>();
  private readonly lastRequestAt = new Map<string, number>();
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (delayMs: number) => Promise<void>;
  private readonly now: () => number;
  private readonly minDelayMs: number;

  constructor(options: RobotsGuardOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
    this.now = options.now ?? Date.now;
    this.minDelayMs = options.minDelayMs ?? Number(process.env.CRAWLER_MIN_DELAY_MS ?? 1000);
  }

  async beforeNavigate(rawUrl: string): Promise<void> {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    const policy = await this.getPolicy(url.origin);
    if (!isPathAllowed(`${url.pathname}${url.search}`, policy)) throw new RobotsDisallowedError(rawUrl);

    const delayMs = Math.max(this.minDelayMs, policy.crawlDelayMs);
    const elapsed = this.now() - (this.lastRequestAt.get(url.origin) ?? Number.NEGATIVE_INFINITY);
    if (elapsed < delayMs) await this.sleep(delayMs - elapsed);
    this.lastRequestAt.set(url.origin, this.now());
  }

  private getPolicy(origin: string): Promise<RobotsPolicy> {
    const cached = this.policies.get(origin);
    if (cached) return cached;
    const policy = this.fetchPolicy(origin);
    this.policies.set(origin, policy);
    return policy;
  }

  private async fetchPolicy(origin: string): Promise<RobotsPolicy> {
    try {
      const response = await this.fetchImpl(`${origin}/robots.txt`, {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return { rules: [], crawlDelayMs: 0 };
      return parseRobotsTxt(await response.text());
    } catch {
      return { rules: [], crawlDelayMs: 0 };
    }
  }
}

export const crawlerRobotsGuard = new RobotsGuard();
