import { openUrl } from "@tauri-apps/plugin-opener";

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch {
    // Păstrează funcționarea și când interfața este testată direct în browser.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
