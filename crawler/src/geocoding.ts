export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

interface ZoneEntry {
  lat: number;
  lng: number;
  /** Orașul căruia îi aparține zona (cheie din CITY_COORDINATES_MAP). */
  city: string;
}

// Known center coordinates for major Romanian zones / neighborhoods.
// `city` previne plasarea unui anunț din Timișoara în București doar pentru că
// titlul conține un nume de zonă care există în ambele orașe (ex. "Victoriei").
const ZONE_COORDINATES_MAP: Record<string, ZoneEntry> = {
  // Timișoara zones
  "complex studentesc": { lat: 45.7467, lng: 21.2428, city: "timisoara" },
  girocului: { lat: 45.7325, lng: 21.2312, city: "timisoara" },
  fabric: { lat: 45.7578, lng: 21.2489, city: "timisoara" },
  soarelui: { lat: 45.7371, lng: 21.2464, city: "timisoara" },
  lipovei: { lat: 45.7761, lng: 21.2386, city: "timisoara" },
  aradului: { lat: 45.7778, lng: 21.2214, city: "timisoara" },
  sagului: { lat: 45.7339, lng: 21.2017, city: "timisoara" },
  mehala: { lat: 45.7681, lng: 21.2056, city: "timisoara" },
  dacia: { lat: 45.7644, lng: 21.2225, city: "timisoara" },
  circumvalatiunii: { lat: 45.7614, lng: 21.2178, city: "timisoara" },
  torontalului: { lat: 45.7739, lng: 21.2064, city: "timisoara" },
  buziasului: { lat: 45.7396, lng: 21.2617, city: "timisoara" },
  bucovina: { lat: 45.7708, lng: 21.2472, city: "timisoara" },
  elisabetin: { lat: 45.7442, lng: 21.2258, city: "timisoara" },
  iosefin: { lat: 45.7458, lng: 21.2078, city: "timisoara" },
  blascovici: { lat: 45.7644, lng: 21.2019, city: "timisoara" },
  "calea martirilor": { lat: 45.7286, lng: 21.2372, city: "timisoara" },
  "calea sever bocu": { lat: 45.7736, lng: 21.2361, city: "timisoara" },

  // București zones
  floreasca: { lat: 44.4639, lng: 26.1028, city: "bucuresti" },
  militari: { lat: 44.4356, lng: 26.0022, city: "bucuresti" },
  titan: { lat: 44.4239, lng: 26.1664, city: "bucuresti" },
  pipera: { lat: 44.4922, lng: 26.1194, city: "bucuresti" },
  pantelimon: { lat: 44.4444, lng: 26.1639, city: "bucuresti" },
  berceni: { lat: 44.3833, lng: 26.1167, city: "bucuresti" },
  "drumul taberei": { lat: 44.4222, lng: 26.0278, city: "bucuresti" },
  victoriei: { lat: 44.4531, lng: 26.0858, city: "bucuresti" },
};

// Known center coordinates for major Romanian cities.
const CITY_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  timisoara: { lat: 45.7537, lng: 21.2257 },
  bucuresti: { lat: 44.4323, lng: 26.1063 },
  bucharest: { lat: 44.4323, lng: 26.1063 },
  cluj: { lat: 46.7712, lng: 23.6236 },
  "cluj-napoca": { lat: 46.7712, lng: 23.6236 },
  iasi: { lat: 47.1585, lng: 27.6014 },
  brasov: { lat: 45.6580, lng: 25.6012 },
  constanta: { lat: 44.1792, lng: 28.6498 },
  craiova: { lat: 44.3302, lng: 23.7949 },
  oradea: { lat: 47.0515, lng: 21.9409 },
  arad: { lat: 46.1866, lng: 21.3123 },
  sibiu: { lat: 45.7983, lng: 24.1256 },
  galati: { lat: 45.4353, lng: 28.0080 },
  ploiesti: { lat: 44.9367, lng: 26.0129 },
  unirii: { lat: 45.7580, lng: 21.2289 },
};

const CITY_ALIASES: Record<string, string> = {
  bucharest: "bucuresti",
  "cluj-napoca": "cluj",
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Attempts to parse explicit lat/lng coordinates embedded in raw string (e.g. "45.7537, 21.2257").
 */
function extractExplicitCoordinates(location: string): Coordinates | null {
  const coordRegex = /(-?\d{1,2}\.\d+)[,\s;]+(-?\d{1,3}\.\d+)/;
  const match = location.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

/**
 * Matches a known zone/city key against a normalized location using word
 * boundaries, so "Str. Fabricii" no longer resolves to the "fabric" zone while
 * "Zona Fabric" still does.
 */
function matchesLocationKey(normalized: string, key: string): boolean {
  if (normalized === key) return true;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(normalized);
}

/** Zona cunoscută dintr-un text, opțional restrânsă la un singur oraș. */
function findZone(normalized: string, city?: string): { key: string; zone: ZoneEntry } | null {
  const keys = Object.keys(ZONE_COORDINATES_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const zone = ZONE_COORDINATES_MAP[key];
    if (city && zone.city !== city) continue;
    if (matchesLocationKey(normalized, key)) return { key, zone };
  }
  return null;
}

function findCity(normalized: string): { key: string; lat: number; lng: number } | null {
  const keys = Object.keys(CITY_COORDINATES_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (matchesLocationKey(normalized, key)) {
      const coord = CITY_COORDINATES_MAP[key];
      return { key: CITY_ALIASES[key] ?? key, lat: coord.lat, lng: coord.lng };
    }
  }
  return null;
}

/**
 * Geocodes a location string into WGS84 lat/lng coordinates.
 * Neighborhood/zone matches take priority over broad city-level coordinates.
 */
export function geocodeLocation(location: string | null | undefined): Coordinates {
  if (!location || typeof location !== "string") {
    return { latitude: null, longitude: null };
  }

  const explicit = extractExplicitCoordinates(location);
  if (explicit) {
    return explicit;
  }

  const normalized = normalizeText(location);
  if (!normalized) {
    return { latitude: null, longitude: null };
  }

  const zone = findZone(normalized);
  if (zone) {
    return { latitude: zone.zone.lat, longitude: zone.zone.lng };
  }

  const city = findCity(normalized);
  if (city) {
    return { latitude: city.lat, longitude: city.lng };
  }

  return { latitude: null, longitude: null };
}

/**
 * Geocodare pentru un anunț întreg. Câmpul `location` al portalurilor e adesea
 * doar orașul, ceea ce ar aduna toate anunțurile în același punct pe hartă;
 * titlul menționează frecvent cartierul ("Apartament 2 camere Girocului").
 * Zona din titlu e acceptată doar dacă aparține orașului dedus din `location`,
 * ca un nume ambiguu să nu mute anunțul în alt oraș.
 */
export function geocodeListing(location: string | null | undefined, title?: string | null): Coordinates {
  const base = geocodeLocation(location);
  if (base.latitude === null || base.longitude === null) {
    return base;
  }

  const normalizedLocation = normalizeText(location ?? "");
  if (findZone(normalizedLocation)) {
    return base; // locația indică deja o zonă — nu o suprascriem cu titlul
  }

  const city = findCity(normalizedLocation);
  if (!city || !title) {
    return base;
  }

  const zoneFromTitle = findZone(normalizeText(title), city.key);
  if (zoneFromTitle) {
    return { latitude: zoneFromTitle.zone.lat, longitude: zoneFromTitle.zone.lng };
  }
  return base;
}

/**
 * Augments a listing object with latitude and longitude coordinates.
 */
export function withGeocodedCoordinates<
  T extends { location?: string | null; title?: string | null; latitude?: number | null; longitude?: number | null }
>(listing: T): T & Coordinates {
  const existingLat = listing.latitude ?? null;
  const existingLng = listing.longitude ?? null;

  if (existingLat !== null && existingLng !== null) {
    return {
      ...listing,
      latitude: existingLat,
      longitude: existingLng,
    };
  }

  const geocoded = geocodeListing(listing.location, listing.title);
  return {
    ...listing,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
  };
}
