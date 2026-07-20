import { Listing } from '../types';

export function generatePrintHtml(listings: Listing[]): string {
  const dateStr = new Date().toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = listings
    .map(
      (l, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <strong>${l.title}</strong><br/>
        <small style="color: #64748b;">${l.transaction_type === 'sale' ? 'De vânzare' : 'De închiriat'} · ${l.property_type || 'Apartament'}${l.surface_sqm ? ` · ${l.surface_sqm} m²` : ''}</small>
      </td>
      <td><strong>${l.price ? `${l.price.toLocaleString('ro-RO')} ${l.currency || '€'}` : 'Nespecificat'}</strong></td>
      <td>${l.location || 'Nespecificată'}</td>
      <td>${l.seller_type === 'owner' ? 'Proprietar' : l.seller_type === 'agency' ? 'Agenție' : 'Dezvoltator'}</td>
      <td>${l.listing_url ? `<a href="${l.listing_url}" target="_blank">Link anunț</a>` : '-'}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Raport Proprietăți Vatrio — ${dateStr}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #007aff; padding-bottom: 12px; margin-bottom: 24px; }
          h1 { margin: 0; font-size: 24px; color: #007aff; }
          .meta { font-size: 13px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { text-align: left; background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; vertical-align: top; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Vatrio Property CRM</h1>
            <div class="meta">Raport prezentare client — ${listings.length} proprietăți selectate</div>
          </div>
          <div class="meta">Generat la: ${dateStr}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Proprietate</th>
              <th>Preț</th>
              <th>Locație</th>
              <th>Vânzător</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Document generat automat de Vatrio Tool. Toate drepturile rezervate.
        </div>
      </body>
    </html>
  `;
}

export function printListingsPdf(listings: Listing[]): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(generatePrintHtml(listings));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
