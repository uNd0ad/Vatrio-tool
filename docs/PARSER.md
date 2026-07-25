# Parserul de anunțuri

Etapa dintre crawler și bază: `crawler → parser → db → ui`.

Scraperele întorc text de portal, nu date. Parserul (`crawler/src/parser/`) ia ce
a citit crawlerul — titlu, locație, textul cardului, textul prețului, URL — și
formează anunțul în forma folosită de tool: cartier canonic, camere, suprafață,
preț, tip de proprietate și de tranzacție, tip de vânzător.

Rulează în două locuri, ambele înainte de orice scriere: `crawler/src/index.ts`
(rulare statică) și `crawler/src/queue.ts` (mod coadă). `upsertListings` mai
apelează o dată `parseListings` ca ultimă poartă — parsarea e idempotentă, deci
un anunț deja parsat trece neatins.

## Cartierele

`ListaCartiereTM.txt` din rădăcina proiectului e **sursa de adevăr** pentru care
cartiere există. Catalogul din `crawler/src/parser/neighborhoods.ts` adaugă peste
lista aceea forma canonică (cu diacritice) și aliasurile sub care scriu
portalurile; lista din `src/utils/neighborhoods.ts` alimentează filtrul din UI.
Ambele au teste care le compară cu fișierul, deci nu pot să divergă în tăcere.

Ordinea de căutare e ordinea încrederii: **locația** portalului, apoi **titlul**,
apoi **textul cardului**. Primul câmp concludent câștigă, ca o mențiune
întâmplătoare din descriere („la 5 minute de Iosefin") să nu bată zona
declarată.

Reguli care previn încadrările greșite:

- potrivire pe cuvinte întregi — „Strada Fabricii" nu e cartierul *Fabric*, iar
  comuna *Giroc* nu e cartierul *Girocului*;
- numele generice (*Modern*, *Stadion*) cer un marcaj de zonă („zona Modern") sau
  un segment de locație de sine stătător — altfel „apartament modern" ar deveni
  cartier;
- numele care acoperă mai multe cartiere („Calea Aradului", fără *Est*/*Vest*)
  rămân **neîncadrate**, cu avertismentul `ambiguous_neighborhood`;
- anunțurile din comunele din jur (Dumbrăvița, Giroc, Moșnița…) nu primesc
  cartier din Timișoara, ci avertismentul `outside_timisoara`.

Când parserul nu poate decide, `neighborhood` rămâne `null`. Un cartier greșit e
mai scump decât unul lipsă: locația brută se păstrează oricum în `location`.

### Cum adaugi un cartier sau un alias

1. Adaugă rândul în `ListaCartiereTM.txt`.
2. Adaugă intrarea în `crawler/src/parser/neighborhoods.ts` (nume canonic +
   aliasuri) și numele în `src/utils/neighborhoods.ts`.
3. Rulează `npm test` în `crawler/` și în rădăcină — testele de catalog verifică
   potrivirea cu fișierul.

Zonele pe care parserul nu le încadrează apar în jurnalul rulării
(`[Parser] Locații neîncadrate: …`) și în evenimentul `parse_completed`: acolo se
văd candidații pentru aliasuri noi.

## Avertismente (`parse_warnings`)

Etichete stabile, salvate pe fiecare anunț pentru triaj de calitate:

| Etichetă | Ce înseamnă |
| --- | --- |
| `neighborhood_unresolved` | Niciun cartier din listă nu s-a potrivit |
| `ambiguous_neighborhood` | Numele acoperă mai multe cartiere (ex. „Calea Aradului") |
| `multiple_neighborhoods` | Textul menționa mai multe zone; s-a ales cea mai specifică |
| `outside_timisoara` | Anunț dintr-o localitate din afara orașului |
| `price_missing` | Preț absent, zero sau negativ |
| `price_per_sqm` | Prețul citit era pe m² („1.450 €/mp"), nu prețul anunțului — valoarea e respinsă |
| `price_out_of_range` | Preț neplauzibil pentru tipul tranzacției — valoarea e păstrată, dar marcată |
| `surface_implausible` | Suprafața de la scraper e în afara intervalului 8–2000 m² |
| `surface_missing` | Fără suprafață (nu se aplică terenurilor) |
| `rooms_unresolved` | Fără număr de camere la un apartament sau o casă |

## Baza de date

Migrația `20260725000100_listing_parser_fields.sql` adaugă `neighborhood`,
`rooms` și `parse_warnings` în `public.listings`. Până e aplicată, crawlerul
detectează coloanele lipsă și scrie fără ele (cu avertisment în consolă), iar
UI-ul cade pe setul vechi de coloane — nicio rulare nu se pierde din cauza unei
migrații neaplicate.

Anunțurile intrate în bază înainte de parser își primesc cartierul prin
`backfillParserFields()`, care rulează o dată per crawl: `upsertListings` ignoră
rândurile existente, deci fără pasul ăsta anunțurile vechi ar rămâne fără
cartier.

Pentru tot istoricul dintr-o dată, imediat după `supabase db push`:

```sh
cd crawler
npm run backfill:cartiere
```
