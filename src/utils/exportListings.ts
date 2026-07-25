import { Listing } from '../types';
import { calculatePricePerSqm } from './pricePerSqm';

/**
 * Converts an array of listings to a UTF-8 CSV string with BOM for Excel compatibility.
 */
export function convertListingsToCsv(listings: Listing[]): string {
  const headers = [
    'ID',
    'Titlu',
    'Preț',
    'Monedă',
    'Preț/m²',
    'Locație',
    'Cartier',
    'Tip proprietate',
    'Suprafață m²',
    'Camere',
    'Sursă',
    'Vânzător',
    'Tranzacție',
    'Data adăugării',
    'Status',
    'URL anunț',
  ];

  const rows = listings.map((l) => {
    const pricePerSqm = calculatePricePerSqm(l) ?? '';
    const dateStr = l.date_scraped ? new Date(l.date_scraped).toLocaleDateString('ro-RO') : '';

    return [
      l.id,
      l.title ? `"${l.title.replace(/"/g, '""')}"` : '',
      l.price !== null ? l.price : '',
      l.currency || 'EUR',
      pricePerSqm,
      l.location ? `"${l.location.replace(/"/g, '""')}"` : '',
      l.neighborhood || '',
      l.property_type || '',
      l.surface_sqm !== null ? l.surface_sqm : '',
      l.rooms ?? '',
      l.source,
      l.seller_type,
      l.transaction_type,
      dateStr,
      l.status,
      l.listing_url || '',
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return '\uFEFF' + csvContent;
}

/**
 * Triggers a browser download of the generated CSV report.
 */
export function downloadCsvReport(listings: Listing[], filename = 'vatrio-raport-imobiliar.csv'): void {
  const csv = convertListingsToCsv(listings);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJsonReport(listings: Listing[], filename = 'vatrio-raport-imobiliar.json'): void {
  const jsonStr = JSON.stringify(listings, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
