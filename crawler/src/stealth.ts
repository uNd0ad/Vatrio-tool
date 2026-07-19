import type { BrowserContext, Page } from "playwright";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];

export function getRandomUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

export function getProxyConfig(): { server: string; username?: string; password?: string } | undefined {
  const proxyList = process.env.PROXIES || process.env.CRAWLER_PROXY;
  if (!proxyList) return undefined;

  const proxies = proxyList
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (proxies.length === 0) return undefined;

  const selected = proxies[Math.floor(Math.random() * proxies.length)];
  try {
    const url = new URL(selected.startsWith("http") ? selected : `http://${selected}`);
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    };
  } catch {
    return { server: selected };
  }
}

export async function applyStealthScripts(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    // 1. Mask navigator.webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // 2. Mock languages & plugins
    Object.defineProperty(navigator, "languages", {
      get: () => ["ro-RO", "ro", "en-US", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // 3. Mock window.chrome runtime
    (window as unknown as { chrome: unknown }).chrome = {
      runtime: {},
      loadTimes: () => ({}),
      csi: () => ({}),
      app: {},
    };

    // 4. Mask WebGL renderer to avoid Headless GPU detection
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
      // UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) return "Intel Inc.";
      // UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) return "Intel Iris OpenGL Engine";
      return getParameter.apply(this, [parameter]);
    };
  });
}

export async function humanDelay(page: Page, minMs = 1200, maxMs = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await page.waitForTimeout(delay);
}
