function compact(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isImobiliareListingCandidate(card: {
  title: string;
  href: string;
  cardText: string;
}): boolean {
  if (!card.title || !card.href) return false;
  return !compact(`${card.title} ${card.href} ${card.cardText}`).includes("adaugaanunt");
}
