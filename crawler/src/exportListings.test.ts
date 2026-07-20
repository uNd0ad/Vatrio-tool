import test from 'node:test';
import assert from 'node:assert/strict';

export function convertListingsToCsv(listings: Array<{ id: string; title: string; price: number | null; surface_sqm: number | null; status: string }>): string {
  const headers = ['ID', 'Titlu', 'Preț', 'Status'];
  const rows = listings.map((l) => [
    l.id,
    l.title ? `"${l.title.replace(/"/g, '""')}"` : '',
    l.price !== null ? l.price : '',
    l.status,
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return '\uFEFF' + csvContent;
}

test('convertListingsToCsv generates valid CSV string with UTF-8 BOM', () => {
  const mockData = [
    { id: '1', title: 'Apartament 2 camere "Central"', price: 85000, surface_sqm: 55, status: 'new' },
    { id: '2', title: 'Garsonieră', price: 45000, surface_sqm: 30, status: 'contacted' },
  ];

  const csv = convertListingsToCsv(mockData);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Apartament 2 camere ""Central""'));
  assert.ok(csv.includes('85000'));
});
