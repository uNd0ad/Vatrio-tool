# Vatrio Tool — CRM intern de anunțuri imobiliare

Tool intern pentru urmărirea anunțurilor (OLX/Storia/Imobiliare.ro) cu status tracking manual.
Nu extrage și nu stochează date personale (nume/telefon) — doar metadate despre anunț
(titlu, preț, zonă, tip, poză, link către anunțul original). Telefonul îl vezi manual,
pe pagina sursă, în momentul în care decizi să suni.

## Arhitectură

```
vatrio-tool/
├── src/            → interfața desktop (React + TS, rulează în Tauri)
├── src-tauri/       → shell-ul nativ (Rust, generat de Tauri — nu trebuie să scrii Rust)
├── crawler/         → script Node.js separat, rulează în cloud pe cron
└── supabase_schema.sql
```

Fluxul: **crawler** (cloud, cron) → scrie în **Supabase** (Postgres) → **aplicația desktop**
(Tauri, pe calculatorul tău) citește și actualizează statusul.

## 1. Setup Supabase (5 min)

1. Cont gratuit pe [supabase.com](https://supabase.com), creează proiect nou.
2. În SQL Editor, rulează conținutul din `supabase_schema.sql`.
3. Din Project Settings → API, copiază:
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

**Important**: selectorii CSS din `src/sites/olx.ts` sunt un punct de plecare —
verifică-i pe pagina reală OLX înainte de prima rulare (vezi comentariul din fișier).

### Rulare programată (cron)

Pentru a rula automat (ex. la fiecare 6 ore), cea mai simplă variantă e un serviciu
gratuit/ieftin ca [Railway](https://railway.app) sau [Render](https://render.com) cu
un cron job care execută `npm start` în directorul `crawler/`.

## Ce urmează

- [ ] Verifică și fixează selectorii OLX pe pagina reală
- [ ] Adaugă `crawlStoria` și `crawlImobiliare` pe modelul din `olx.ts`
- [ ] Configurează cron-ul în cloud
- [ ] (opțional) Adaugă câmp `property_type` extras din URL/filtre căutare

## Administrarea utilizatorilor

Aplicația folosește două roluri: `master` și `member`. Cheia privilegiată Supabase
nu este inclusă în aplicația Tauri; operațiile administrative sunt executate de
Edge Function `manage-users`.

### Configurare inițială

1. Rulează `supabase_auth_migration.sql` în Supabase SQL Editor.
2. Deschide `supabase/master_accounts.sql`, înlocuiește `MASTER_EMAIL_HERE` cu
   emailul contului principal și rulează fișierul în SQL Editor.
3. În Supabase → Authentication → Email Templates → **Invite user**, copiază
   conținutul din `supabase/email-templates/invite-user.html`.
4. Configurează Postmark în Authentication → SMTP Settings.
5. Publică funcția:

```bash
supabase login
supabase link --project-ref PROJECT_REF
supabase functions deploy manage-users
```

Variabilele `SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY` sunt disponibile
automat funcției în proiectul Supabase. Nu le adăuga în frontend.

Contul master va vedea secțiunea **Utilizatori**, de unde poate trimite invitații
și șterge conturi member. Utilizatorul invitat primește prin email un cod, apoi
alege **Activează contul** în ecranul de login, introduce emailul, codul și parola nouă.
