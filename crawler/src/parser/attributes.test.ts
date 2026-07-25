import assert from "node:assert/strict";
import test from "node:test";
import { checkPrice, isPlausibleSurface, parseRooms } from "./attributes";

test("citește numărul de camere din titlu", () => {
  assert.equal(parseRooms("Apartament 2 camere Girocului"), 2);
  assert.equal(parseRooms("Apartament 3 camere, etaj 2"), 3);
  assert.equal(parseRooms("Vând apartament 2cam Soarelui"), 2);
  assert.equal(parseRooms("Apartament 1 cameră, Iosefin"), 1);
  assert.equal(parseRooms("Casă cu trei camere în Plopi"), 3);
});

test("garsoniera e o cameră", () => {
  assert.equal(parseRooms("Garsonieră de închiriat zona Lipovei"), 1);
  assert.equal(parseRooms("Garsoniera confort 1, Complexul Studentesc"), 1);
});

test("titlul are prioritate față de textul cardului", () => {
  assert.equal(parseRooms("Apartament 2 camere Fabric", "bloc cu 4 camere la mansardă"), 2);
  assert.equal(parseRooms("Apartament de vânzare", "Apartament 3 camere, 68 m²"), 3);
});

test("nu inventează camere unde nu sunt", () => {
  assert.equal(parseRooms("Teren intravilan 500 mp Ghiroda"), null);
  assert.equal(parseRooms(""), null);
  assert.equal(parseRooms(null), null);
  // 45 nu e un număr de camere plauzibil pentru un anunț rezidențial.
  assert.equal(parseRooms("Spațiu cu 45 camere"), null);
});

test("validează suprafața cu aceleași limite ca extragerea din text", () => {
  assert.equal(isPlausibleSurface(54), true);
  assert.equal(isPlausibleSurface(8), true);
  assert.equal(isPlausibleSurface(2000), true);
  assert.equal(isPlausibleSurface(3), false);
  assert.equal(isPlausibleSurface(2600), false);
  assert.equal(isPlausibleSurface(null), false);
  assert.equal(isPlausibleSurface(undefined), false);
});

test("aruncă prețul pe metru pătrat citit ca preț total", () => {
  const perSqm = checkPrice({
    price: 1450,
    currency: "EUR",
    transactionType: "sale",
    priceText: "1.450 €/mp",
  });
  assert.equal(perSqm.price, null);
  assert.deepEqual(perSqm.warnings, ["price_per_sqm"]);

  const perSqm2 = checkPrice({ price: 1800, currency: "EUR", transactionType: "sale", priceText: "1800 EUR/m²" });
  assert.equal(perSqm2.price, null);
});

test("prețul lipsă sau zero e marcat, nu păstrat", () => {
  assert.deepEqual(checkPrice({ price: null, currency: "EUR", transactionType: "sale" }), {
    price: null,
    warnings: ["price_missing"],
  });
  assert.deepEqual(checkPrice({ price: 0, currency: "EUR", transactionType: "rent" }), {
    price: null,
    warnings: ["price_missing"],
  });
});

test("păstrează prețurile plauzibile fără avertismente", () => {
  assert.deepEqual(checkPrice({ price: 85000, currency: "EUR", transactionType: "sale", priceText: "85.000 €" }), {
    price: 85000,
    warnings: [],
  });
  assert.deepEqual(checkPrice({ price: 450, currency: "EUR", transactionType: "rent", priceText: "450 €" }), {
    price: 450,
    warnings: [],
  });
  // O chirie în lei rămâne plauzibilă după conversie (3.500 lei ≈ 700 €).
  assert.deepEqual(checkPrice({ price: 3500, currency: "RON", transactionType: "rent", priceText: "3.500 lei" }), {
    price: 3500,
    warnings: [],
  });
});

test("marchează prețurile din afara intervalului, dar nu le pierde", () => {
  // Chirie de 250.000 € — aproape sigur un preț de vânzare pus la închirieri.
  const rent = checkPrice({ price: 250000, currency: "EUR", transactionType: "rent", priceText: "250.000 €" });
  assert.equal(rent.price, 250000);
  assert.deepEqual(rent.warnings, ["price_out_of_range"]);

  // Vânzare de 500 € — de obicei "preț la cerere" sau un preț parțial.
  const sale = checkPrice({ price: 500, currency: "EUR", transactionType: "sale", priceText: "500 €" });
  assert.equal(sale.price, 500);
  assert.deepEqual(sale.warnings, ["price_out_of_range"]);
});
