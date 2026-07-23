# Integrarea cu Clavium (sincronizare bidirecțională)

Structura pentru schimbul de date între Vatrio și platforma Clavium. **API-ul
Clavium nu există încă**, deci toată plumbăria e construită și testată, iar
singurul punct rămas de conectat este marcat clar. Până atunci integrarea
raportează explicit că nu e configurată — nu eșuează în tăcere.

## Fluxul

```
Vatrio (UI)  →  Edge Function clavium-sync  →  [ API Clavium ]  →  clavium_sync (Supabase)
                       ↑ cheia API, server-side              ↓
                 callClaviumApi() — singurul punct de conectat
```

- **Ieșire** (`push`): trimiți anunțuri selectate către Clavium.
- **Intrare** (`pull`): aduci înapoi ce a întors Clavium — potriviri cu clienți,
  interes, status pe platformă — în tabelul `clavium_sync`.

Interfața nu vorbește niciodată direct cu Clavium. Cheia API stă în Edge
Function (ca la `trigger-crawl` / `manage-users`).

## Piesele

| Piesă | Rol |
| --- | --- |
| `supabase/migrations/20260723000300_clavium_sync.sql` | Tabelul `clavium_sync` — stare per anunț, ambele sensuri |
| `supabase/functions/clavium-sync/index.ts` | Edge Function: acțiunile `push` / `pull`, autentificare, adaptorul de API |
| `src/services/clavium.ts` | `pushListingsToClavium` · `pullClaviumUpdates` · `fetchClaviumSync` |
| Butonul „Trimite la Clavium” (drawer detalii) | Declanșează `push` pentru anunțul curent |

## Contractul de date

### Ieșire — un anunț trimis la Clavium (`push`)

```json
{
  "external_id": "uuid-ul anunțului din Vatrio",
  "title": "…", "price": 95000, "currency": "EUR",
  "location": "Timișoara", "property_type": "apartment",
  "surface_sqm": 54, "transaction_type": "sale", "seller_type": "owner",
  "image_url": "https://…", "listing_url": "https://…", "source": "olx"
}
```

Clavium trebuie să răspundă cu, pentru fiecare anunț:

```json
{ "records": [
  { "external_id": "…", "clavium_id": "id-ul din Clavium", "status": "synced", "data": { } }
] }
```

### Intrare — actualizări din Clavium (`pull`)

Aceeași formă `records`, cu `status: "matched"` și `data` conținând ce
raportează Clavium (potriviri cu clienți etc.). Se scriu în `clavium_sync`.

`status ∈ { pending, synced, failed, matched, removed }`.

## Ce mai rămâne de făcut când Clavium are API

1. Setează secretele:
   ```sh
   supabase secrets set CLAVIUM_API_URL=https://api.clavium.ro/v1
   supabase secrets set CLAVIUM_API_KEY=<token>
   ```
2. Verifică/ajustează **doar** funcția `callClaviumApi` din
   `supabase/functions/clavium-sync/index.ts` — endpoint-urile și forma
   răspunsului, ca să se potrivească cu API-ul real. Restul funcției nu se atinge.
3. `supabase functions deploy clavium-sync`.

Fără secrete, `callClaviumApi` întoarce `configured: false`, iar funcția
răspunde `501` cu mesaj clar, pe care butonul îl afișează.

## Aplicarea în producție

```sh
supabase db push --linked          # aplică migrația clavium_sync
supabase functions deploy clavium-sync
```

Migrația e inertă până există API — creează doar tabelul gol și regulile de
acces (citire pentru autentificați, scriere doar din Edge Function).
