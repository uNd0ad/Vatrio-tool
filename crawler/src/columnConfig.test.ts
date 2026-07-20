import test from 'node:test';
import assert from 'node:assert/strict';

export interface ColumnConfig {
  id: string;
  width: number;
  minWidth?: number;
}

function updateColumnWidth(columns: ColumnConfig[], id: string, newWidth: number): ColumnConfig[] {
  return columns.map((col) => {
    if (col.id !== id) return col;
    const min = col.minWidth ?? 40;
    return { ...col, width: Math.max(min, Math.round(newWidth)) };
  });
}

test('updateColumnWidth enforces minWidth constraint', () => {
  const cols: ColumnConfig[] = [
    { id: 'price', width: 140, minWidth: 100 },
    { id: 'status', width: 130, minWidth: 80 },
  ];

  const result1 = updateColumnWidth(cols, 'price', 200);
  assert.equal(result1.find((c) => c.id === 'price')?.width, 200);

  const result2 = updateColumnWidth(cols, 'price', 50); // smaller than minWidth (100)
  assert.equal(result2.find((c) => c.id === 'price')?.width, 100);
});
