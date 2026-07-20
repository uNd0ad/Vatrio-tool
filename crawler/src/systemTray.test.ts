import test from 'node:test';
import assert from 'node:assert/strict';

function formatTrayTitle(statusText: string, count: number): string {
  const badge = count > 0 ? `(${count}) ` : '';
  return `${badge}Vatrio Property CRM — ${statusText}`;
}

test('formatTrayTitle formats window title and badge count correctly', () => {
  assert.equal(formatTrayTitle('Conectat', 5), '(5) Vatrio Property CRM — Conectat');
  assert.equal(formatTrayTitle('Sincronizat', 0), 'Vatrio Property CRM — Sincronizat');
});
