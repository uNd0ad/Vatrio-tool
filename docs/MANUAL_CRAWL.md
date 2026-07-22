# Pornirea crawlerului din aplicație

Butonul **„🔎 Caută anunțuri noi"** din antetul aplicației pornește crawlerul la
cerere, fără să aștepți rularea programată (cron la 6 ore).

## Ce face, de fapt

Aplicația desktop **nu** poate rula crawlerul: acesta e Node + Playwright cu
Chromium și are nevoie de cheia `service_role`, care este ținută deliberat în
afara aplicației. În schimb:

```
Aplicație → Edge Function `trigger-crawl` → GitHub Actions (workflow_dispatch)
          → workflow-ul „Run Real Estate Crawler" → scrie în Supabase
```

Tokenul GitHub stă în Edge Function (server-side), exact ca la `manage-users`.

Butonul **„Reîncarcă lista"** e diferit: recitește doar ce e deja în baza de
date, fără să pornească nimic.

## Configurare (o singură dată)

### 1. Creează un token GitHub

Un [fine-grained personal access token](https://github.com/settings/tokens?type=beta)
pe repository-ul `Vatrio-tool`, cu permisiunea **Actions: Read and write**
(scrierea e necesară pentru `workflow_dispatch`; citirea, pentru verificarea
rulărilor în curs). Pentru un token clasic, scope-ul echivalent este `repo`.

### 2. Pune-l ca secret Supabase

```sh
supabase secrets set GITHUB_DISPATCH_TOKEN=ghp_xxxxxxxxxxxx
```

Opțional, dacă repository-ul, workflow-ul sau branch-ul diferă de valorile
implicite (`uNd0ad/Vatrio-tool`, `crawler.yml`, `dev`):

```sh
supabase secrets set GITHUB_REPOSITORY=owner/repo
supabase secrets set GITHUB_CRAWLER_WORKFLOW=crawler.yml
supabase secrets set GITHUB_CRAWLER_REF=dev
```

### 3. Publică Edge Function-ul

```sh
supabase functions deploy trigger-crawl
```

Fără pasul 2, funcția răspunde explicit că declanșarea manuală nu e configurată,
iar butonul afișează acel mesaj — nu eșuează în tăcere.

## Protecții

- **Rulări suprapuse:** înainte de declanșare se întreabă GitHub dacă există deja
  o rulare `queued` sau `in_progress`; în acest caz cererea e refuzată cu mesaj.
- **Interval minim:** 10 minute între două declanșări, calculat din ultima rulare
  raportată de GitHub.
- **Autentificare:** doar utilizatorii autentificați pot cere un crawl. Spre
  deosebire de `manage-users`, nu e nevoie de contul master — operația nu
  modifică nimic, doar reîmprospătează datele comune.

## Cât durează

Workflow-ul pornește în ~30-60 de secunde și rulează câteva minute (instalează
Chromium, parcurge portalurile). Anunțurile noi apar în aplicație după ce se
termină — apasă apoi **„Reîncarcă lista"**, sau așteaptă sincronizarea realtime,
care le aduce singură pe măsură ce sunt scrise.
