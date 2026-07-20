import test from 'node:test';
import assert from 'node:assert/strict';

interface ActionItem {
  id: string;
  label: string;
}

function filterCommands(items: ActionItem[], query: string): ActionItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter((i) => i.label.toLowerCase().includes(q));
}

test('filterCommands filters commands matching query', () => {
  const actions: ActionItem[] = [
    { id: '1', label: 'Mergi la Panou Kanban' },
    { id: '2', label: 'Mergi la Hartă' },
    { id: '3', label: 'Deschide setările' },
  ];

  assert.equal(filterCommands(actions, 'kanban').length, 1);
  assert.equal(filterCommands(actions, 'setări').length, 1);
  assert.equal(filterCommands(actions, '').length, 3);
});
