import test from 'node:test';
import assert from 'node:assert/strict';

interface ChangelogEntry {
  version: string;
  changes: string[];
}

function formatChangelogHeader(entry: ChangelogEntry): string {
  return `Vatrio v${entry.version} (${entry.changes.length} noutăți)`;
}

test('formatChangelogHeader generates release title correctly', () => {
  const entry: ChangelogEntry = {
    version: '1.4.0',
    changes: ['Feature A', 'Feature B', 'Feature C'],
  };

  assert.equal(formatChangelogHeader(entry), 'Vatrio v1.4.0 (3 noutăți)');
});
