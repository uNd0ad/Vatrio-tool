import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePrintHtml } from '../../src/utils/printListings.js';

test('generatePrintHtml outputs valid HTML with listing details', () => {
  const listings: any[] = [
    {
      id: '1',
      title: 'Apartament 2 Camere Cluj',
      price: 120000,
      currency: '€',
      location: 'Cluj-Napoca',
      transaction_type: 'sale',
      seller_type: 'owner',
      listing_url: 'https://olx.ro/example',
    },
  ];

  const html = generatePrintHtml(listings);
  assert.ok(html.includes('Vatrio Property CRM'));
  assert.ok(html.includes('Apartament 2 Camere Cluj'));
  assert.ok(html.includes('120.000 €'));
  assert.ok(html.includes('https://olx.ro/example'));
});
