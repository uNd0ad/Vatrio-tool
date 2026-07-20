export interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  minWidth?: number;
  visible: boolean;
}

const STORAGE_KEY = 'vatrio_table_column_widths_v1';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'select', label: '', width: 36, minWidth: 36, visible: true },
  { id: 'property', label: 'PROPRIETATE', width: 320, minWidth: 180, visible: true },
  { id: 'price', label: 'PREȚ', width: 140, minWidth: 100, visible: true },
  { id: 'location', label: 'LOCAȚIE', width: 180, minWidth: 110, visible: true },
  { id: 'source', label: 'SURSĂ', width: 100, minWidth: 80, visible: true },
  { id: 'seller', label: 'VÂNZĂTOR', width: 110, minWidth: 90, visible: true },
  { id: 'date', label: 'ADĂUGAT', width: 120, minWidth: 90, visible: true },
  { id: 'status', label: 'STATUS', width: 130, minWidth: 100, visible: true },
  { id: 'actions', label: '', width: 70, minWidth: 60, visible: true },
];

export function getColumnConfigs(): ColumnConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const saved: Record<string, number> = JSON.parse(raw);
    return DEFAULT_COLUMNS.map((col) => ({
      ...col,
      width: saved[col.id] || col.width,
    }));
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function saveColumnWidth(columnId: string, newWidth: number): ColumnConfig[] {
  const current = getColumnConfigs();
  const target = current.find((c) => c.id === columnId);
  const min = target?.minWidth || 50;
  const safeWidth = Math.max(min, Math.round(newWidth));

  const map: Record<string, number> = {};
  const updated = current.map((col) => {
    const w = col.id === columnId ? safeWidth : col.width;
    map[col.id] = w;
    return { ...col, width: w };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  return updated;
}
