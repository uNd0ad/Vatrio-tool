export interface MonitorInfo {
  availLeft: number;
  availTop: number;
  screenWidth: number;
  screenHeight: number;
  isExtended?: boolean;
}

const STORAGE_KEY = 'vatrio_multi_monitor_v1';

export function getSavedMonitorInfo(): MonitorInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCurrentMonitorInfo(): MonitorInfo {
  const scr = window.screen as any;
  const info: MonitorInfo = {
    availLeft: scr.availLeft || 0,
    availTop: scr.availTop || 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    isExtended: scr.isExtended ?? false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  return info;
}
