# Vatrio pe telefon (PWA)

Aceeași aplicație rulează și pe telefon, instalată de pe ecranul de start. Nu e
o aplicație separată: e build-ul web al aceluiași cod, cu un layout dedicat
pentru ecrane mici.

## Ce se schimbă sub 900px

Pragul e ținut în două locuri care trebuie să rămână sincronizate: constanta
`MOBILE_QUERY` din [`src/hooks/useMediaQuery.ts`](../src/hooks/useMediaQuery.ts)
și media query-ul din [`src/app.css`](../src/app.css).

| Desktop | Telefon |
| --- | --- |
| Sidebar fix de 230px | Bară de navigare jos, cu contoare |
| Tabel cu 9 coloane (>1000px lățime minimă) | Listă de carduri, fără derulare orizontală |
| Drawer lateral de detalii | Drawer pe tot ecranul |
| Bara de unelte pe un rând | Grilă de 2 coloane, ținte de atingere ≥38px |

Cardul de anunț arată poza, prețul (și €/m²), zona, sursa, tipul vânzătorului și
vechimea, cu acțiuni directe: stea, selectare, schimbarea statusului și
**„Vezi anunțul"**. Numărul de telefon nu apare nicăieri în aplicație — nu e
colectat (vezi README); butonul deschide pagina sursă, unde îl vezi în momentul
în care decizi să suni.

## Publicare

Build-ul web e static, deci merge pe orice găzduire (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, nginx):

```sh
npm run build      # rezultatul în dist/
```

Cerințe:

- **HTTPS obligatoriu** — service worker-ul și instalarea nu funcționează pe
  HTTP simplu (excepție: `localhost`, pentru testare).
- **SPA fallback**: toate rutele trebuie servite din `index.html`.
- Variabilele `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` trebuie setate la
  build. Cheia anon e publică prin design; accesul la date rămâne guvernat de
  politicile RLS din Supabase.

## Instalare pe telefon

- **Android / Chrome:** meniu → *Adaugă la ecranul de pornire* (sau bannerul de
  instalare).
- **iOS / Safari:** butonul de partajare → *Adaugă pe ecranul principal*.
  Instalarea funcționează doar din Safari, nu din alte browsere.

Aplicația pornește apoi pe tot ecranul, fără bara de adrese.

## Offline

Service worker-ul ([`public/sw.js`](../public/sw.js)) ține în cache doar shell-ul
aplicației, ca ea să pornească fără rețea. **Nu** pune în cache răspunsurile
Supabase — datele trebuie să rămână proaspete, iar aplicația are deja propriul
cache de anunțuri în `localStorage` și o coadă de modificări offline care se
sincronizează la revenirea conexiunii.

O versiune nouă e preluată la următoarea pornire cu rețea disponibilă.

## Relația cu aplicația desktop

Build-ul Tauri rămâne neschimbat. Service worker-ul se înregistrează doar când
aplicația e servită prin `http(s)`, deci în Tauri (care folosește protocol
propriu) nu intervine deloc. Funcțiile specifice desktopului (fereastră
detașată, tavă de sistem) degradează singure: fie au deja variantă de browser,
fie sunt inerte.
