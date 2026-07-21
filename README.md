# Vatrio Tool — CRM intern de anunțuri imobiliare

Tool intern pentru urmărirea anunțurilor (OLX/Storia/Imobiliare.ro) cu status tracking manual.
Nu extrage și nu stochează date personale (nume/telefon) — doar metadate despre anunț
(titlu, preț, zonă, tip, poză, link către anunțul original). Telefonul îl vezi manual,
pe pagina sursă, în momentul în care decizi să suni.

## Arhitectură

```
vatrio-tool/
├── src/            → interfața desktop (React + TS, rulează în Tauri)
├── src-tauri/       → shell-ul nativ (Rust, generat de Tauri)
├── crawler/         → crawler Node.js + Playwright separat
├── supabase/        → migrații SQL Supabase versiuni de schemă
└── docs/            → ghiduri (Data Dictionary, Connection Pooling, Backup)
```

Fluxul: **crawler** (cloud/local, cron) → scrie în **Supabase** (Postgres cu pgBouncer connection pooling) → **aplicația desktop** (Tauri) citește și actualizează datele.

## 1. Setup Supabase (5 min)

1. Cont gratuit pe [supabase.com](https://supabase.com), creează proiect nou.
2. Migrațiile se aplică automat din directorul `supabase/migrations/`.
3. Ghidul de Connection Pooling și scalare conexiuni se află în [`docs/POOLING_GUIDE.md`](file:///Users/alex/Desktop/Vatrio-tool/vatrio-tool/docs/POOLING_GUIDE.md).
4. Structura completă a bazei de date este documentată în [`docs/DATA_DICTIONARY.md`](file:///Users/alex/Desktop/Vatrio-tool/vatrio-tool/docs/DATA_DICTIONARY.md).
5. Din Project Settings → API, copiază:
   - `Project URL` → `SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY` (pentru aplicația desktop)
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (pentru crawler — **nu o expune niciodată în frontend**)

## 2. Setup aplicație desktop

Ai nevoie de instalat local (o singură dată):
- [Node.js](https://nodejs.org) (18+)
- [Rust](https://rustup.rs) — necesar pentru Tauri. Pe Windows ai nevoie și de
  "Microsoft C++ Build Tools", pe Linux de `webkit2gtk` (vezi
  [ghidul oficial Tauri](https://v2.tauri.app/start/prerequisites/) pentru sistemul tău).

```bash
cd vatrio-tool
cp .env.example .env   # completează cu datele din Supabase
npm install
npm run tauri dev      # deschide aplicația în modul dezvoltare
```

Pentru build final (executabil `.exe`/`.app`):
```bash
npm run tauri build
```

## 3. Setup crawler

```bash
cd crawler
cp .env.example .env   # completează cu SUPABASE_URL + SERVICE_ROLE_KEY
npm install
npx playwright install chromium   # descarcă browserul headless
npm start
```

### Configurarea căutărilor (orașe, filtre)

Implicit crawlerul caută apartamente în Timișoara. Pentru alte orașe sau filtre
nu modifica codul: copiază `crawler/searches.example.json` în
`crawler/searches.json` și pune acolo URL-urile tale de căutare (construiește-le
o dată în browser, cu filtrele setate, apoi copiază URL-ul rezultat). Site-urile
lipsă din fișier rămân pe valorile implicite. Alternativ, setează
`CRAWLER_SEARCHES_PATH` către un JSON cu aceeași structură. Politica de crawling
(robots.txt, rate limiting) este documentată în
[`docs/CRAWLING_POLICY.md`](docs/CRAWLING_POLICY.md).

### Rulare programată (cron)

Pentru a rula automat (ex. la fiecare 6 ore), cea mai simplă variantă e un serviciu
gratuit/ieftin ca [Railway](https://railway.app) sau [Render](https://render.com) cu
un cron job care execută `npm start` în directorul `crawler/`.

## Administrarea utilizatorilor

Aplicația folosește două roluri: `master` și `member`. Cheia privileged Supabase
nu este inclusă în aplicația Tauri; operațiile administrative sunt executate de
Edge Function `manage-users`.

Contul master va vedea secțiunea **Utilizatori**, de unde poate trimite invitații
și șterge conturi member. Utilizatorul invitat primește prin email un cod, apoi
alege **Activează contul** în ecranul de login, introduce emailul, codul și parola nouă.

