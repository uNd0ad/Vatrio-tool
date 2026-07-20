import test from 'node:test';
import assert from 'node:assert/strict';

function shouldPlayAudio(enabled: boolean, hasNewItems: boolean): boolean {
  return enabled && hasNewItems;
}

test('shouldPlayAudio evaluates audio play conditions correctly', () => {
  assert.equal(shouldPlayAudio(true, true), true);
  assert.equal(shouldPlayAudio(false, true), false);
  assert.equal(shouldPlayAudio(true, false), false);
});
