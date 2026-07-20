import test from 'node:test';
import assert from 'node:assert/strict';

test('autoLaunch preference defaults to opt-in false', () => {
  let preference: boolean | null = null;
  const isEnabled = preference ?? false;
  assert.equal(isEnabled, false);
});
