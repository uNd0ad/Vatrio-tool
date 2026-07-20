export type TableDensity = 'compact' | 'comfortable';

const STORAGE_KEY = 'vatrio_table_density_v1';

export function getTableDensity(): TableDensity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'compact' || raw === 'comfortable') return raw;
    return 'comfortable';
  } catch {
    return 'comfortable';
  }
}

export function saveTableDensity(density: TableDensity): TableDensity {
  localStorage.setItem(STORAGE_KEY, density);
  return density;
}
