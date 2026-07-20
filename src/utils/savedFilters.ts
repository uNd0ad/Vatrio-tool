export interface SavedFilter {
  id: string;
  name: string;
  statusFilter: string;
  transactionType: string;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  minSqm: string;
  maxSqm: string;
  dateRange: string;
  createdAt: string;
}

const STORAGE_KEY = 'vatrio_saved_filters_v1';

export function getSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSavedFilter(newFilter: Omit<SavedFilter, 'id' | 'createdAt'>): SavedFilter[] {
  const current = getSavedFilters();
  const item: SavedFilter = {
    ...newFilter,
    id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteSavedFilter(id: string): SavedFilter[] {
  const current = getSavedFilters();
  const updated = current.filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
