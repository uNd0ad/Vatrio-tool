# Politica de crawling — Vatrio Tool

Acest document fixează regulile după care rulează crawlerul și rezolvă explicit
tensiunea dintre două mecanisme care coexistă în cod: respectarea `robots.txt`
(`crawler/src/robots.ts`) și tehnicile de reducere a detecției
(`crawler/src/stealth.ts`).

## Ce colectează crawlerul

Doar metadate publice despre anunțuri: titlu, preț, zonă, tip, suprafață, poză,
link către anunțul original. **Nu extrage și nu stochează date personale**
(nume, telefon, email) — telefonul se vede manual, pe pagina sursă, în momentul
contactării. Orice extindere a datelor colectate trebuie să treacă din nou prin
acest filtru.

## Reguli dure (nu se ocolesc niciodată)

1. **`robots.txt` este autoritar.** Fiecare navigare trece prin
   `crawlerRobotsGuard.beforeNavigate()` (vezi `retry.ts#gotoWithRetry`); un
   URL interzis de robots.txt ridică `RobotsDisallowedError` și nu este accesat.
   Nicio optimizare sau tehnică de stealth nu are voie să sară peste acest guard.
2. **Rate limiting politicos.** Între căutări se aplică `humanDelay`, fiecare
   site are timeout propriu (`timeouts.ts`), iar circuit breaker-ul
   (`circuitBreaker.ts`) oprește complet un site care eșuează repetat, în loc să
   insiste. Dacă un site ne blochează, răspunsul acceptat este *back-off*, nu
   escaladarea evaziunii.
3. **Frecvență limitată.** Rulările sunt programate (cron la 6 ore), cu
   `frequency.ts` care sare peste site-urile al căror interval nu a expirat.

## Rolul tehnicilor de stealth — și limita lor

`stealth.ts` (user-agent realist, headere de browser, mascarea
`navigator.webdriver`, delay-uri umane) există pentru un singur motiv: zidurile
anti-bot generice (ex. detecția de headless) blochează inclusiv crawlere care
respectă robots.txt și limitele de rată. Aceste tehnici reduc rata de blocare
pentru un trafic deja politicos — **nu sunt licență pentru a ocoli interdicții
explicite**. Concret:

- Stealth se aplică doar pe URL-uri permise de robots.txt.
- Nu se adaugă rezolvare de CAPTCHA, rotație agresivă de proxy-uri pentru a
  ocoli ban-uri, sau alte mecanisme al căror singur scop este anularea unei
  decizii explicite de blocare a site-ului sursă.
- Detecția de conținut anti-bot (`antiBot.ts`) oprește parsarea și alertează,
  în loc să reîncerce agresiv.

## Riscul acceptat

Termenii de utilizare ai portalurilor (OLX, Storia, Imobiliare, HomeZZ,
Publi24) pot interzice accesul automatizat chiar și acolo unde robots.txt îl
permite. Proiectul acceptă conștient acest risc pentru un tool intern cu volum
mic (câteva sute de pagini pe zi, un singur oraș implicit), cu datele folosite
exclusiv intern și cu link înapoi către anunțul original. Dacă un portal
comunică explicit că nu dorește acest trafic (blocare persistentă, cerere
directă), site-ul respectiv se dezactivează din `CRAWLER_ENABLED_SITES`.
