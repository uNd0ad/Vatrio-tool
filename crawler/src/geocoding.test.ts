import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { geocodeListing, geocodeLocation, withGeocodedCoordinates } from "./geocoding";

test("geocodes known Romanian cities correctly", () => {
  const timisoara = geocodeLocation("Timișoara, Județul Timiș");
  assert.equal(timisoara.latitude, 45.7537);
  assert.equal(timisoara.longitude, 21.2257);

  const bucuresti = geocodeLocation("Bucuresti Sector 1");
  assert.equal(bucuresti.latitude, 44.4323);
  assert.equal(bucuresti.longitude, 26.1063);

  const cluj = geocodeLocation("Cluj-Napoca, Centru");
  assert.equal(cluj.latitude, 46.7712);
  assert.equal(cluj.longitude, 23.6236);
});

test("geocodes specific city zones", () => {
  const zone = geocodeLocation("Complex Studentesc, Timisoara");
  assert.equal(zone.latitude, 45.7467);
  assert.equal(zone.longitude, 21.2428);

  const floreasca = geocodeLocation("Zona Floreasca, Bucuresti");
  assert.equal(floreasca.latitude, 44.4639);
  assert.equal(floreasca.longitude, 26.1028);
});

test("extracts explicit lat/lng coordinates if provided in text", () => {
  const result = geocodeLocation("Locație exactă: 45.7537, 21.2257 - Timișoara");
  assert.equal(result.latitude, 45.7537);
  assert.equal(result.longitude, 21.2257);
});

test("returns null for unknown locations or null inputs", () => {
  assert.deepEqual(geocodeLocation(null), { latitude: null, longitude: null });
  assert.deepEqual(geocodeLocation("   "), { latitude: null, longitude: null });
  assert.deepEqual(geocodeLocation("Unknown Location XYZ 999"), { latitude: null, longitude: null });
});

test("withGeocodedCoordinates attaches lat/lng to raw listing", () => {
  const listing = {
    title: "Apartament 2 camere",
    location: "Girocului, Timisoara",
  };
  const geocoded = withGeocodedCoordinates(listing);
  assert.equal(geocoded.latitude, 45.7325);
  assert.equal(geocoded.longitude, 21.2312);
});

test("listing coordinates migration file exists and contains valid constraints", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "../supabase/migrations/20260719001700_listing_coordinates.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");
  assert.match(sql, /add column if not exists latitude double precision/);
  assert.match(sql, /add column if not exists longitude double precision/);
  assert.match(sql, /latitude >= -90 and latitude <= 90/);
  assert.match(sql, /longitude >= -180 and longitude <= 180/);
  assert.match(sql, /listings_active_coordinates_idx/);
});

test("geocodeListing refines a city-level location using a zone from the title", () => {
  // Cazul real OLX: locația e doar orașul, cartierul apare doar în titlu.
  const coords = geocodeListing("Timișoara", "Apartament 2 camere zona Girocului");
  assert.deepEqual(coords, { latitude: 45.7325, longitude: 21.2312 });
});

test("geocodeListing ignores a title zone that belongs to another city", () => {
  // "Victoriei" e zonă în București; un anunț din Timișoara nu are voie să sară acolo.
  const coords = geocodeListing("Timișoara", "Apartament lângă Piața Victoriei");
  assert.deepEqual(coords, { latitude: 45.7537, longitude: 21.2257 });
});

test("geocodeListing keeps a zone already present in the location field", () => {
  const coords = geocodeListing("Timișoara, Complex Studentesc", "Apartament zona Aradului");
  assert.deepEqual(coords, { latitude: 45.7467, longitude: 21.2428 });
});

test("geocodeListing returns null when the location cannot be resolved", () => {
  assert.deepEqual(geocodeListing(null, "Apartament Girocului"), { latitude: null, longitude: null });
});
