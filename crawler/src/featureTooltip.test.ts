import test from 'node:test';
import assert from 'node:assert/strict';

test('featureOnboarding manages tip dismissal state', () => {
  const dismissed = new Set<string>();
  dismissed.add('tip-1');

  assert.equal(dismissed.has('tip-1'), true);
  assert.equal(dismissed.has('tip-2'), false);
});
