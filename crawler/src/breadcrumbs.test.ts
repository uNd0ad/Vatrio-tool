import test from 'node:test';
import assert from 'node:assert/strict';

interface BreadcrumbItem {
  label: string;
}

function buildBreadcrumbPath(view: string, listingTitle?: string): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [{ label: 'Vatrio' }];

  if (view === 'listings') path.push({ label: 'Panou general' });
  else if (view === 'board') path.push({ label: 'Kanban' });
  else if (view === 'map') path.push({ label: 'Hartă' });

  if (listingTitle) path.push({ label: listingTitle });

  return path;
}

test('buildBreadcrumbPath generates correct trail', () => {
  assert.equal(buildBreadcrumbPath('listings').length, 2);
  assert.equal(buildBreadcrumbPath('listings', 'Apartament 2 Camere')[2].label, 'Apartament 2 Camere');
});
