import { foldText } from "./text";

/**
 * Catalogul cartierelor Timișoarei — singura listă acceptată de parser.
 *
 * `ListaCartiereTM.txt` din rădăcina proiectului rămâne sursa de adevăr pentru
 * *care* cartiere există; aici le dăm forma canonică (cu diacritice, așa cum
 * apar în UI) și variantele sub care le scriu portalurile.
 * `neighborhoods.test.ts` compară cele două liste, deci nu pot să divergă.
 */
export interface NeighborhoodEntry {
  /** Numele canonic, scris cum vrem să apară în tool. */
  name: string;
  /**
   * Variante suplimentare întâlnite în anunțuri. Forma pliată a numelui
   * canonic e adăugată automat, deci aici stau doar aliasurile în plus.
   */
  aliases?: string[];
  /**
   * Numele care există și ca adjectiv sau reper ("apartament modern", "lângă
   * stadion") se acceptă doar lângă un marcaj de zonă ("zona Modern") sau ca
   * segment de locație de sine stătător. Altfel ar aspira sute de anunțuri.
   */
  requiresZoneMarker?: boolean;
}

export const TIMISOARA_NEIGHBORHOODS: NeighborhoodEntry[] = [
  { name: "Antene", aliases: ["antenelor"] },
  { name: "Aradului Est", aliases: ["calea aradului est"] },
  { name: "Aradului Vest", aliases: ["calea aradului vest"] },
  { name: "Baba Dochia" },
  { name: "Badea Cârțan", aliases: ["piata badea cartan"] },
  { name: "Blașcovici" },
  { name: "Braytim", aliases: ["braitim"] },
  { name: "Bucovina" },
  { name: "Calea Buziașului", aliases: ["buziasului"] },
  { name: "Calea Șagului", aliases: ["sagului"] },
  { name: "Cetate", aliases: ["centru cetate"] },
  { name: "Ciarda Roșie", aliases: ["ciarda"] },
  {
    name: "Complexul Studențesc",
    aliases: ["complex studentesc", "studentesc", "campus studentesc"],
  },
  { name: "Crișan" },
  { name: "Dâmbovița" },
  { name: "Dorobanților" },
  { name: "Elisabetin" },
  { name: "Fabric" },
  { name: "Fratelia" },
  { name: "Freidorf" },
  { name: "Gara Mică" },
  { name: "Gara Nord", aliases: ["gara de nord"] },
  { name: "Ghiroda" },
  { name: "Girocului", aliases: ["calea girocului"] },
  { name: "Iosefin" },
  { name: "Kogălniceanu", aliases: ["mihail kogalniceanu"] },
  { name: "Kuntz", aliases: ["kuncz"] },
  { name: "Lipovei", aliases: ["calea lipovei"] },
  { name: "Lunei", aliases: ["calea lunei"] },
  { name: "Mehala" },
  { name: "Mircea cel Bătrân" },
  // "modern" e cel mai folosit adjectiv din anunțurile imobiliare.
  { name: "Modern", requiresZoneMarker: true },
  { name: "Odobescu" },
  { name: "Ovidiu Balea" },
  { name: "Plopi" },
  { name: "Polona" },
  { name: "Ronaț" },
  { name: "Soarelui" },
  { name: "Solventul" },
  // "lângă stadion" e un reper, nu neapărat cartierul Stadion.
  { name: "Stadion", requiresZoneMarker: true },
  { name: "Steaua" },
  { name: "Tipografilor" },
  { name: "Torontalului", aliases: ["calea torontalului"] },
  { name: "UMT" },
];

/** Numele canonice, pentru liste de filtrare în UI și validări. */
export const NEIGHBORHOOD_NAMES: string[] = TIMISOARA_NEIGHBORHOODS.map((entry) => entry.name);

export interface NeighborhoodAlias {
  entry: NeighborhoodEntry;
  /** Aliasul în formă pliată, gata de potrivire. */
  folded: string;
}

/**
 * Toate aliasurile, cele mai lungi primele: "aradului vest" trebuie încercat
 * înaintea aliasurilor scurte, altfel un nume compus s-ar rezolva pe bucăți.
 */
export const NEIGHBORHOOD_ALIASES: NeighborhoodAlias[] = TIMISOARA_NEIGHBORHOODS.flatMap((entry) => {
  const folded = new Set([foldText(entry.name), ...(entry.aliases ?? []).map(foldText)]);
  return [...folded].filter(Boolean).map((alias) => ({ entry, folded: alias }));
}).sort((a, b) => b.folded.length - a.folded.length);

/**
 * Nume care acoperă mai multe cartiere din listă: "Calea Aradului", fără "Est"
 * sau "Vest", nu poate fi atribuit niciunuia. Le marcăm ca ambigue în loc să
 * dăm cu banul — un cartier greșit e mai scump decât unul lipsă.
 */
export const AMBIGUOUS_ALIASES: Record<string, string[]> = {
  aradului: ["Aradului Est", "Aradului Vest"],
  "calea aradului": ["Aradului Est", "Aradului Vest"],
};

/**
 * Localități care nu sunt Timișoara, dar apar constant în aceleași căutări de
 * portal (comune din jur și orașele mari). Un anunț din Dumbrăvița nu are cum
 * să aibă cartier din listă, iar dacă i-am da unul ar strica atât harta, cât și
 * analizele pe zone. Ghiroda lipsește intenționat: e în lista de cartiere.
 */
export const NON_TIMISOARA_LOCALITIES: string[] = [
  "dumbravita",
  "giroc",
  "chisoda",
  "mosnita noua",
  "mosnita veche",
  "mosnita",
  "sanmihaiu roman",
  "sanmihaiu german",
  "sacalaz",
  "sanandrei",
  "remetea mare",
  "dudestii noi",
  "becicherecu mic",
  "carpinis",
  "pischia",
  "bucovat",
  "utvin",
  "sannicolau mare",
  "lugoj",
  "deta",
  "jimbolia",
  "buzias",
  "recas",
  "faget",
  "bucuresti",
  "cluj napoca",
  "cluj",
  "arad",
  "oradea",
  "brasov",
  "sibiu",
  "iasi",
  "constanta",
  "craiova",
];

/** Aliasurile care semnalează explicit orașul Timișoara. */
export const TIMISOARA_ALIASES: string[] = ["timisoara", "timis"];
