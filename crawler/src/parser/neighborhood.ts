import {
  AMBIGUOUS_ALIASES,
  NEIGHBORHOOD_ALIASES,
  NON_TIMISOARA_LOCALITIES,
  TIMISOARA_ALIASES,
  type NeighborhoodEntry,
} from "./neighborhoods";
import { containsPhrase, foldText, foldedSegments } from "./text";

/** Câmpul din care a fost dedus cartierul, în ordinea în care le încercăm. */
export type NeighborhoodSource = "location" | "title" | "text";

export interface NeighborhoodFields {
  /** Câmpul de locație al portalului — cel mai de încredere. */
  location?: string | null;
  title?: string | null;
  /** Textul integral al cardului (descriere, badge-uri, breadcrumbs). */
  text?: string | null;
}

export interface NeighborhoodResult {
  neighborhood: string | null;
  source: NeighborhoodSource | null;
  warnings: NeighborhoodWarning[];
}

export type NeighborhoodWarning =
  | "neighborhood_unresolved"
  | "ambiguous_neighborhood"
  | "multiple_neighborhoods"
  | "outside_timisoara";

// Cuvintele care introduc o zonă în textul unui anunț. Sunt singura dovadă
// acceptată pentru numele generice ("zona Modern" da, "apartament modern" nu).
const ZONE_MARKERS = ["zona", "zone", "cartier", "cartierul", "complexul", "complex", "ansamblul", "ansamblu"];

/** Cât de sigură e o potrivire; scorul mai mare câștigă. */
const SCORE_EXACT_SEGMENT = 3;
const SCORE_ZONE_MARKER = 2;
const SCORE_PLAIN = 1;

interface Candidate {
  entry: NeighborhoodEntry;
  alias: string;
  score: number;
}

function markerPattern(alias: string): RegExp {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:${ZONE_MARKERS.join("|")})\\s+(?:de\\s+)?${escaped}\\b`);
}

/**
 * Cea mai bună potrivire de cartier într-un singur câmp.
 *
 * `segments` există doar pentru locație: un segment care e exact numele zonei
 * ("Timișoara, Modern") e dovadă mai puternică decât aceeași expresie găsită
 * oriunde în text.
 */
function matchField(folded: string, segments: string[]): Candidate[] {
  const candidates = new Map<string, Candidate>();
  for (const { entry, folded: alias } of NEIGHBORHOOD_ALIASES) {
    let score = 0;
    if (segments.includes(alias)) {
      score = SCORE_EXACT_SEGMENT;
    } else if (markerPattern(alias).test(folded)) {
      score = SCORE_ZONE_MARKER;
    } else if (!entry.requiresZoneMarker && containsPhrase(folded, alias)) {
      score = SCORE_PLAIN;
    }
    if (score === 0) continue;

    // Un cartier poate fi prins prin mai multe aliasuri; păstrăm potrivirea cea
    // mai puternică (și, la scor egal, aliasul cel mai specific).
    const previous = candidates.get(entry.name);
    if (!previous || score > previous.score || (score === previous.score && alias.length > previous.alias.length)) {
      candidates.set(entry.name, { entry, alias, score });
    }
  }
  return [...candidates.values()];
}

function hasAmbiguousAlias(folded: string, segments: string[]): boolean {
  return Object.keys(AMBIGUOUS_ALIASES).some(
    (alias) => segments.includes(alias) || containsPhrase(folded, alias)
  );
}

/**
 * Alege între potrivirile unui câmp: scor, apoi aliasul cel mai lung. Dacă doi
 * candidați rămân la egalitate, câmpul e neconcludent și trecem la următorul.
 */
function pickBest(candidates: Candidate[]): { candidate: Candidate; contested: boolean } | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort(
    (a, b) => b.score - a.score || b.alias.length - a.alias.length
  );
  const [best, runnerUp] = ranked;
  if (runnerUp && runnerUp.score === best.score && runnerUp.alias.length === best.alias.length) {
    return null;
  }
  return { candidate: best, contested: ranked.length > 1 };
}

/**
 * Găsește cartierul unui anunț din câmpurile aduse de crawler.
 *
 * Ordinea câmpurilor e ordinea încrederii: locația portalului, apoi titlul
 * (unde agenții scriu zona mai des decât în locație), apoi restul textului
 * cardului. Primul câmp concludent câștigă, ca o mențiune întâmplătoare din
 * descriere ("la 5 minute de Iosefin") să nu bată locația declarată.
 */
export function resolveNeighborhood(fields: NeighborhoodFields): NeighborhoodResult {
  const warnings: NeighborhoodWarning[] = [];
  const foldedLocation = foldText(fields.location);
  const foldedTitle = foldText(fields.title);
  const foldedText = foldText(fields.text);
  const locationSegments = foldedSegments(fields.location);

  const mentionsTimisoara = [foldedLocation, foldedTitle, foldedText].some((value) =>
    TIMISOARA_ALIASES.some((alias) => containsPhrase(value, alias))
  );
  // Locația e cea care spune unde e anunțul; comuna din descriere ("la 10 min
  // de Dumbrăvița") nu-l mută afară din oraș.
  const outsideCity = NON_TIMISOARA_LOCALITIES.some(
    (locality) => containsPhrase(foldedLocation, locality) || containsPhrase(foldedTitle, locality)
  );
  if (outsideCity && !mentionsTimisoara) {
    return { neighborhood: null, source: null, warnings: ["outside_timisoara"] };
  }

  const fieldOrder: Array<{ source: NeighborhoodSource; folded: string; segments: string[] }> = [
    { source: "location", folded: foldedLocation, segments: locationSegments },
    { source: "title", folded: foldedTitle, segments: [] },
    { source: "text", folded: foldedText, segments: [] },
  ];

  let sawAmbiguous = false;
  for (const field of fieldOrder) {
    if (!field.folded) continue;
    const best = pickBest(matchField(field.folded, field.segments));
    if (best) {
      if (best.contested) warnings.push("multiple_neighborhoods");
      return { neighborhood: best.candidate.entry.name, source: field.source, warnings };
    }
    if (hasAmbiguousAlias(field.folded, field.segments)) sawAmbiguous = true;
  }

  warnings.push(sawAmbiguous ? "ambiguous_neighborhood" : "neighborhood_unresolved");
  return { neighborhood: null, source: null, warnings };
}
