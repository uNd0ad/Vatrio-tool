export interface StoredPrice {
  price: number | null;
  currency: string | null;
}

export function hasPriceChanged(stored: StoredPrice, observed: StoredPrice): boolean {
  return stored.price !== observed.price || stored.currency !== observed.currency;
}
