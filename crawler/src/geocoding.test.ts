import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { geocodeLocation, withGeocodedCoordinates } from "./geocoding";

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
