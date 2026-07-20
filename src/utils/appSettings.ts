export interface AppSettings {
  crawlFrequencyMinutes: number;
  defaultTransactionType: 'all' | 'sale' | 'rent';
  enableDesktopNotifications: boolean;
  enablePriceDropAlerts: boolean;
  enableMinimizeToTray: boolean;
  autoLaunchOnStartup: boolean;
  autoRefreshIntervalSeconds: number;
  theme: 'light' | 'dark' | 'system';
}

const STORAGE_KEY = 'vatrio_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  crawlFrequencyMinutes: 30,
  defaultTransactionType: 'all',
  enableDesktopNotifications: true,
  enablePriceDropAlerts: true,
  enableMinimizeToTray: true,
  autoLaunchOnStartup: false,
  autoRefreshIntervalSeconds: 60,
  theme: 'system',
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const next = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
