import test from 'node:test';
import assert from 'node:assert/strict';

interface MockFilter {
  id: string;
  name: string;
}

function manageSavedFilters(current: MockFilter[], action: { type: 'add' | 'delete'; filter?: MockFilter; id?: string }): MockFilter[] {
  if (action.type === 'add' && action.filter) {
    return [action.filter, ...current];
  }
  if (action.type === 'delete' && action.id) {
    return current.filter((f) => f.id !== action.id);
  }
  return current;
}

test('manageSavedFilters adds and deletes smart folders correctly', () => {
  let list: MockFilter[] = [];

  list = manageSavedFilters(list, { type: 'add', filter: { id: '1', name: 'Apartamente Cluj' } });
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Apartamente Cluj');

  list = manageSavedFilters(list, { type: 'delete', id: '1' });
  assert.equal(list.length, 0);
});
