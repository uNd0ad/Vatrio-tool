const STORAGE_KEY = 'vatrio_minimize_to_tray_v1';

export function getMinimizeToTraySetting(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return JSON.parse(raw);
  } catch {
    return true;
  }
}

export function saveMinimizeToTraySetting(enabled: boolean): boolean {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  return enabled;
}

export function handleWindowMinimize(event: { preventDefault: () => void }): boolean {
  const minimizeToTray = getMinimizeToTraySetting();
  if (minimizeToTray) {
    event.preventDefault();
    try {
      (window as any).__TAURI__?.window?.getCurrentWindow()?.hide();
    } catch {
      // Browser fallback
    }
    return true;
  }
  return false;
}
