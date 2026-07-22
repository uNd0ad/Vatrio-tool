import { describe, expect, it } from "vitest";
import { boundsOf, clusterListings, splitByGeolocation } from "./mapClusters";
import { makeListing } from "../testing/makeListing";

describe("splitByGeolocation", () => {
  it("separă anunțurile localizate de cele fără coordonate", () => {
    const located = makeListing({ id: "a", latitude: 45.75, longitude: 21.22 });
    const missing = makeListing({ id: "b", latitude: null, longitude: null });
    const partial = makeListing({ id: "c", latitude: 45.75, longitude: null });

    const result = splitByGeolocation([located, missing, partial]);
    expect(result.located.map((l) => l.id)).toEqual(["a"]);
    expect(result.missingCoordinates.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("respinge coordonate în afara intervalului valid", () => {
    const bogus = makeListing({ id: "x", latitude: 999, longitude: 21 });
    expect(splitByGeolocation([bogus]).located).toHaveLength(0);
  });

  it("nu inventează poziții pentru anunțuri fără coordonate", () => {
    const items = [
      makeListing({ id: "a", latitude: null, longitude: null }),
      makeListing({ id: "b", latitude: null, longitude: null }),
    ];
    expect(splitByGeolocation(items).located).toEqual([]);
    expect(clusterListings(items)).toEqual([]);
  });
});

describe("clusterListings", () => {
  it("grupează anunțurile de la aceeași coordonată într-un singur punct", () => {
    // Cazul real: geocodarea rezolvă la centrul orașului, deci multe anunțuri
    // primesc coordonate identice și fără grupare s-ar suprapune perfect.
    const items = [
      makeListing({ id: "a", latitude: 45.7537, longitude: 21.2257 }),
      makeListing({ id: "b", latitude: 45.7537, longitude: 21.2257 }),
      makeListing({ id: "c", latitude: 45.7467, longitude: 21.2428 }),
    ];
    const clusters = clusterListings(items);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].listings.map((l) => l.id)).toEqual(["a", "b"]);
    expect(clusters[1].listings.map((l) => l.id)).toEqual(["c"]);
  });

  it("ordonează grupurile descrescător după număr de anunțuri", () => {
    const clusters = clusterListings([
      makeListing({ id: "solo", latitude: 46, longitude: 22 }),
      makeListing({ id: "x", latitude: 45, longitude: 21 }),
      makeListing({ id: "y", latitude: 45, longitude: 21 }),
    ]);
    expect(clusters[0].listings).toHaveLength(2);
  });
});

describe("boundsOf", () => {
  it("returnează null fără puncte", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("cuprinde toate punctele", () => {
    const bounds = boundsOf(clusterListings([
      makeListing({ id: "a", latitude: 45.70, longitude: 21.20 }),
      makeListing({ id: "b", latitude: 45.80, longitude: 21.30 }),
    ]));
    expect(bounds).toEqual({ southWest: [45.70, 21.20], northEast: [45.80, 21.30] });
  });
});
