export interface SavedViewFilter {
  id: string;
  name: string;
  location?: string;
  maxPrice?: number;
  propertyType?: string;
  sellerType?: string;
  transactionType?: string;
}

const STORAGE_KEY = 'vatrio_saved_views_v1';

export function getSavedViews(): SavedViewFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSavedViews();
    return JSON.parse(raw);
  } catch {
    return getDefaultSavedViews();
  }
}

export function saveView(view: Omit<SavedViewFilter, 'id'>): SavedViewFilter {
  const views = getSavedViews();
  const newView: SavedViewFilter = {
    ...view,
    id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  views.push(newView);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  return newView;
}

export function deleteSavedView(id: string): void {
  const views = getSavedViews().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

export function getDefaultSavedViews(): SavedViewFilter[] {
  return [
    { id: 'default-1', name: 'Timișoara Studios Under 60k', location: 'Timișoara', maxPrice: 60000, propertyType: 'apartment' },
    { id: 'default-2', name: 'Bucharest Rentals Under 500€', location: 'București', maxPrice: 500, transactionType: 'rent' },
    { id: 'default-3', name: 'Direct Owner Sales', sellerType: 'owner', transactionType: 'sale' },
  ];
}
