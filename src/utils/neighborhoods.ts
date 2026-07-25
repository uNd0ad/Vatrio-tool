/**
 * Cartierele Timișoarei, pentru filtrul din interfață.
 *
 * Parserul crawlerului (`crawler/src/parser/neighborhoods.ts`) ține aceeași
 * listă cu aliasurile de potrivire; aici avem nevoie doar de numele canonice,
 * fără să legăm aplicația desktop de codul crawlerului. Ambele liste sunt
 * verificate față de `ListaCartiereTM.txt` — sursa de adevăr — în testele
 * fiecărui proiect, deci nu pot să divergă în tăcere.
 */
export const NEIGHBORHOODS: string[] = [
  "Antene",
  "Aradului Est",
  "Aradului Vest",
  "Baba Dochia",
  "Badea Cârțan",
  "Blașcovici",
  "Braytim",
  "Bucovina",
  "Calea Buziașului",
  "Calea Șagului",
  "Cetate",
  "Ciarda Roșie",
  "Complexul Studențesc",
  "Crișan",
  "Dâmbovița",
  "Dorobanților",
  "Elisabetin",
  "Fabric",
  "Fratelia",
  "Freidorf",
  "Gara Mică",
  "Gara Nord",
  "Ghiroda",
  "Girocului",
  "Iosefin",
  "Kogălniceanu",
  "Kuntz",
  "Lipovei",
  "Lunei",
  "Mehala",
  "Mircea cel Bătrân",
  "Modern",
  "Odobescu",
  "Ovidiu Balea",
  "Plopi",
  "Polona",
  "Ronaț",
  "Soarelui",
  "Solventul",
  "Stadion",
  "Steaua",
  "Tipografilor",
  "Torontalului",
  "UMT",
];

/** Filtrul de cartier: un cartier anume, toate, sau doar cele neîncadrate. */
export type NeighborhoodFilter = string | "all" | "unknown";

export function neighborhoodLabel(value: string | null | undefined): string {
  return value ?? "Neîncadrat";
}
