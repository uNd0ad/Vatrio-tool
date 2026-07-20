import test from 'node:test';
import assert from 'node:assert/strict';

interface MockScreen {
  availLeft: number;
  availTop: number;
  width: number;
  height: number;
}

function detectPrimaryMonitor(screens: MockScreen[]): MockScreen {
  return screens.find((s) => s.availLeft === 0 && s.availTop === 0) || screens[0];
}

test('detectPrimaryMonitor identifies primary display correctly', () => {
  const screens: MockScreen[] = [
    { availLeft: 1920, availTop: 0, width: 1920, height: 1080 }, // Secondary monitor
    { availLeft: 0, availTop: 0, width: 2560, height: 1440 },   // Primary monitor
  ];

  const primary = detectPrimaryMonitor(screens);
  assert.equal(primary.width, 2560);
});
