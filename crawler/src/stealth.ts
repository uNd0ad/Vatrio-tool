import type { BrowserContext, Page } from "playwright";

export const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];

export function getRandomUserAgent(random: () => number = Math.random): string {
  const index = Math.floor(random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

/**
 * Doar antete valabile pentru orice tip de cerere.
 *
 * `extraHTTPHeaders` se aplică pe context, deci fiecărei cereri — nu doar
 * navigării. Antetele `Sec-Fetch-*` de navigare ajungeau astfel și pe cererile
 * de imagini, unde sunt contradictorii (o poză cerută cu
 * `Sec-Fetch-Dest: document`), iar CDN-ul le respingea. OLX înlocuiește apoi
 * poza cu `no_thumbnail`, deci pierdeam URL-ul: 5 poze din 50 în loc de 50.
 * Chromium trimite oricum antetele Sec-Fetch corecte pentru fiecare tip de
 * cerere; nu trebuie suprascrise.
 */
export function getRealisticHeaders(): Record<string, string> {
  return {
    "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
  };
}

export function getProxyConfig(
  proxyList = process.env.PROXIES || process.env.CRAWLER_PROXY,
  random: () => number = Math.random
): { server: string; username?: string; password?: string } | undefined {
  if (!proxyList) return undefined;

  const proxies = proxyList
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (proxies.length === 0) return undefined;

  const selected = proxies[Math.floor(random() * proxies.length)];
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

export async function humanDelay(
  page: Pick<Page, "waitForTimeout">,
  minMs = 1200,
  maxMs = 3000,
  random: () => number = Math.random
): Promise<void> {
  if (minMs < 0 || maxMs < minMs) throw new RangeError("Invalid human delay range");
  const delay = Math.floor(random() * (maxMs - minMs + 1)) + minMs;
  await page.waitForTimeout(delay);
}
