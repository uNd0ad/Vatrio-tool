import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Page } from "playwright";

interface SaveOptions {
  outputDir?: string;
  now?: () => Date;
}

export async function saveParseFailure(
  page: Pick<Page, "content" | "screenshot">,
  site: string,
  url: string,
  options: SaveOptions = {}
): Promise<string> {
  const outputDir = resolve(options.outputDir ?? process.env.CRAWLER_DEBUG_DIR ?? "debug/parse-failures");
  await mkdir(outputDir, { recursive: true });
  const timestamp = (options.now ?? (() => new Date()))().toISOString().replace(/[:.]/g, "-");
  const safeSite = site.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const filePath = resolve(outputDir, `${timestamp}-${safeSite}.html`);
  const screenshotPath = filePath.replace(/\.html$/, ".png");
  const source = await page.content();
  const metadata = `<!-- Parse failure: ${site} | ${url} -->\n`;
  await writeFile(filePath, metadata + source, "utf8");
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[Parse Failure] Could not save ${site} screenshot: ${detail}`);
  }
  console.warn(`[Parse Failure] Saved ${site} HTML to ${filePath}`);
  return filePath;
}
