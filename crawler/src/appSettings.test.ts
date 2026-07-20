import test from 'node:test';
import assert from 'node:assert/strict';

export interface AppSettings {
  crawlFrequencyMinutes: number;
  defaultTransactionType: 'all' | 'sale' | 'rent';
  enableDesktopNotifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  crawlFrequencyMinutes: 30,
  defaultTransactionType: 'all',
  enableDesktopNotifications: true,
};

function mergeSettings(current: AppSettings, updates: Partial<AppSettings>): AppSettings {
  return { ...current, ...updates };
}

test('mergeSettings updates values correctly', () => {
  const initial = DEFAULT_SETTINGS;
  const updated = mergeSettings(initial, { crawlFrequencyMinutes: 15, enableDesktopNotifications: false });

  assert.equal(updated.crawlFrequencyMinutes, 15);
  assert.equal(updated.enableDesktopNotifications, false);
  assert.equal(updated.defaultTransactionType, 'all');
});
