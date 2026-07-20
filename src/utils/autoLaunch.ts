const STORAGE_KEY = 'vatrio_autolaunch_v1';

export function isAutoLaunchEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return false;
    return JSON.parse(raw);
  } catch {
    return false;
  }
}

export async function setAutoLaunchEnabled(enabled: boolean): Promise<boolean> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  try {
    const autostart = await import('@tauri-apps/plugin-autostart');
    if (enabled) {
      await autostart.enable();
    } else {
      await autostart.disable();
    }
  } catch {
    // Browser fallback
  }
  return enabled;
}
