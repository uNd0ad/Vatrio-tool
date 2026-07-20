import test from 'node:test';
import assert from 'node:assert/strict';

export type TableDensity = 'compact' | 'comfortable';

function toggleDensity(current: TableDensity): TableDensity {
  return current === 'compact' ? 'comfortable' : 'compact';
}

test('toggleDensity switches between compact and comfortable', () => {
  assert.equal(toggleDensity('comfortable'), 'compact');
  assert.equal(toggleDensity('compact'), 'comfortable');
});
