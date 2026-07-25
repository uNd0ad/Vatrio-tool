import assert from "node:assert/strict";
import test from "node:test";
import { resolveNeighborhood } from "./neighborhood";

test("citește cartierul din locația portalului", () => {
  const result = resolveNeighborhood({ location: "Timișoara, Fabric" });
  assert.equal(result.neighborhood, "Fabric");
  assert.equal(result.source, "location");
  assert.deepEqual(result.warnings, []);
});

test("acceptă scrierea fără diacritice și cu alte separatoare", () => {
  assert.equal(resolveNeighborhood({ location: "Timisoara - zona Ronat" }).neighborhood, "Ronaț");
  assert.equal(resolveNeighborhood({ title: "Apartament in Dambovita" }).neighborhood, "Dâmbovița");
  assert.equal(resolveNeighborhood({ title: "Casa zona Ciarda Rosie" }).neighborhood, "Ciarda Roșie");
});

test("mapează variantele portalurilor pe numele canonic", () => {
  assert.equal(
    resolveNeighborhood({ title: "Garsonieră în Complex Studentesc" }).neighborhood,
    "Complexul Studențesc"
  );
  assert.equal(resolveNeighborhood({ location: "Timișoara, Buziașului" }).neighborhood, "Calea Buziașului");
  assert.equal(resolveNeighborhood({ title: "Apartament pe Calea Sagului" }).neighborhood, "Calea Șagului");
  assert.equal(resolveNeighborhood({ title: "Casă în Kuncz" }).neighborhood, "Kuntz");
});

test("locația bate titlul, iar titlul bate textul cardului", () => {
  const locationWins = resolveNeighborhood({
    location: "Timișoara, Iosefin",
    title: "Apartament 2 camere zona Soarelui",
    text: "la 5 minute de Fabric",
  });
  assert.equal(locationWins.neighborhood, "Iosefin");
  assert.equal(locationWins.source, "location");

  const titleWins = resolveNeighborhood({
    location: "Timișoara",
    title: "Apartament 2 camere Soarelui",
    text: "aproape de Elisabetin",
  });
  assert.equal(titleWins.neighborhood, "Soarelui");
  assert.equal(titleWins.source, "title");

  const textFallback = resolveNeighborhood({
    location: "Timiș",
    title: "Apartament 3 camere de vânzare",
    text: "Anunț în cartierul Lipovei, etaj 2",
  });
  assert.equal(textFallback.neighborhood, "Lipovei");
  assert.equal(textFallback.source, "text");
});

test("nu confundă numele de stradă cu cartierul", () => {
  // Fără graniță de cuvânt, "fabric" s-ar potrivi în "Fabricii" și "giroc" în
  // "Girocului" — exact tipul de încadrare greșită pe care parserul îl previne.
  const streets = resolveNeighborhood({ location: "Timișoara, Strada Fabricii de Chibrituri" });
  assert.equal(streets.neighborhood, null);
  assert.equal(resolveNeighborhood({ title: "Teren pe strada Plopilor" }).neighborhood, null);
});

test("numele generice cer un marcaj de zonă", () => {
  // "Modern" e cel mai frecvent adjectiv din anunțuri: fără marcaj nu e cartier.
  assert.equal(resolveNeighborhood({ title: "Apartament modern, complet mobilat" }).neighborhood, null);
  assert.equal(resolveNeighborhood({ title: "Apartament 2 camere zona Modern" }).neighborhood, "Modern");
  assert.equal(resolveNeighborhood({ location: "Timișoara, Modern" }).neighborhood, "Modern");
  assert.equal(resolveNeighborhood({ text: "la 300 m de stadion" }).neighborhood, null);
  assert.equal(resolveNeighborhood({ location: "Timișoara, cartier Stadion" }).neighborhood, "Stadion");
});

test("distinge Aradului Est de Aradului Vest și refuză varianta ambiguă", () => {
  assert.equal(resolveNeighborhood({ location: "Timișoara, Aradului Vest" }).neighborhood, "Aradului Vest");
  assert.equal(
    resolveNeighborhood({ title: "Apartament Calea Aradului Est" }).neighborhood,
    "Aradului Est"
  );

  const ambiguous = resolveNeighborhood({ location: "Timișoara, Calea Aradului" });
  assert.equal(ambiguous.neighborhood, null);
  assert.deepEqual(ambiguous.warnings, ["ambiguous_neighborhood"]);
});

test("nu dă cartier din Timișoara anunțurilor din comunele vecine", () => {
  const dumbravita = resolveNeighborhood({
    location: "Dumbrăvița",
    title: "Apartament 2 camere, zona Lipovei aproape",
  });
  assert.equal(dumbravita.neighborhood, null);
  assert.deepEqual(dumbravita.warnings, ["outside_timisoara"]);

  // Giroc (comună) nu trebuie confundat cu Girocului (cartier).
  assert.equal(resolveNeighborhood({ location: "Giroc, Timiș" }).neighborhood, null);
  assert.equal(resolveNeighborhood({ location: "Timișoara, Calea Girocului" }).neighborhood, "Girocului");
});

test("o comună menționată doar în descriere nu mută anunțul din oraș", () => {
  const result = resolveNeighborhood({
    location: "Timișoara, Torontalului",
    text: "la 10 minute de Dumbrăvița",
  });
  assert.equal(result.neighborhood, "Torontalului");
});

test("alege cartierul cel mai specific când textul menționează mai multe", () => {
  const result = resolveNeighborhood({
    text: "Apartament în zona Complexul Studențesc, la doi pași de Elisabetin",
  });
  assert.equal(result.neighborhood, "Complexul Studențesc");
  assert.ok(result.warnings.includes("multiple_neighborhoods"));
});

test("semnalează anunțurile pe care nu le poate încadra", () => {
  const result = resolveNeighborhood({ location: "Timișoara", title: "Apartament 2 camere de vânzare" });
  assert.equal(result.neighborhood, null);
  assert.deepEqual(result.warnings, ["neighborhood_unresolved"]);
});

test("nu se pierde pe câmpuri lipsă", () => {
  const result = resolveNeighborhood({});
  assert.equal(result.neighborhood, null);
  assert.equal(result.source, null);
  assert.deepEqual(result.warnings, ["neighborhood_unresolved"]);
});
