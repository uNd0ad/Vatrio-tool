# 📋 Vatrio Tool - Future Roadmap & Ideas

Use this file to track and organize features, fixes, and architectural improvements for the Vatrio Property CRM and Crawler.

---

## 🚀 Priority Roadmap

### 1. Scalability & Performance
- [x] **Pagination & Infinite Scroll:** Implement server-side pagination for `fetchListings()` in the desktop app. Currently, it fetches all rows at once, which will slow down as the database grows.
- [x] **On-Demand Data Loading:** Load listing details (like full notes and histories) only when a row is selected.
- [x] **Network Resilience & Offline Cache:** Implement offline capability (e.g., caching listings in `localStorage`) so that users can browse listings without an internet connection, alongside an offline UI indicator.

### 2. Crawler Robustness (`/crawler`)
- [x] **Anti-Detection & Proxy Rotation:** Add proxy support and stealth browser plugins (e.g., `playwright-extra` with stealth plugin) to prevent target websites (OLX, Storia, Imobiliare) from blocking scraper runs.
- [x] **Automated Scraping Schedule:** Move the crawler to run on a server cron schedule or a serverless function (e.g., GitHub Actions or Supabase Edge Functions).
- [x] **Imobiliare.ro Scraping Integration:** Implement the Playwright crawler for `imobiliare.ro` (under `crawler/src/sites/imobiliare.ts`) in the same modular fashion as the OLX crawler to fetch listing URL, pricing, images, and surface data.
- [x] **Storia.ro Scraping Integration:** Implement the Playwright crawler for `storia.ro` (under `crawler/src/sites/storia.ts`) to complete the coverage of all supported property portals.
- [x] **HomeZZ & Publi24 Scraping Integration:** Expand the crawler to support `homezz.ro` and `publi24.ro` real estate platforms (which will also require updating the database schema check constraint for allowed sources).
- [x] **Differentiate OLX and Storia Listings:** In the OLX scraper (`crawlOlx`), detect if a scraped listing card's URL points to `storia.ro` and register its source as `"storia"` instead of `"olx"` (since OLX search pages embed Storia ads).
- [x] **Deduplication Engine:** Detect identical property ads posted on different platforms (or multiple times by different agencies) using price, surface area, and location proximity.

### 3. CRM Desktop App Feature Enhancements (`/src`)
- [x] **Real-time Updates:** Use Supabase Realtime subscriptions to automatically inject new scraper listings into the UI without needing to press the "Actualizează" (Refresh) button.
- [x] **Dark Mode Support:** Implement a theme switch system in `app.css`.
- [x] **Bulk Actions:** Allow checking multiple rows to change status (e.g., set status to "Refuzat" for 10 listings at once).
- [x] **Visual Analytics Page:** Add a dashboard tab showing:
  - Price trends and distribution.
  - Average price per square meter per location.
  - Owner-to-Agency ratio.
- [x] **Advanced Filtering:** Filter by price range, surface area range, and date scraped range.
- [x] **Mac Native App Icon Scaling:** Set up a script/process to automatically scale and generate macOS native app icons (`.icns` and target png sizes) using the master [favicon.png](file:///Users/alex/Desktop/Vatrio-tool/vatrio-tool/favicon.png) source image.
- [x] **Typography & Text Scaling:** Refine font sizes, line heights, and hierarchy (text scale) to establish a highly professional, balanced, and eye-pleasing visual layout across all screen resolutions.
- [x] **Property Image Scaling in Detail Drawer:** Optimize listing photos displayed inside the detail sidebar/drawer to scale beautifully (using proper object-fit, borders, and aspect ratios) without distortion or stretching when clicked.
- [x] **Clavium.ro Platform Export:** Implement a transfer function (e.g., a "Trimite la Clavium" button in the detail sidebar) that posts the selected property information directly to the `clavium.ro` web platform API or webhook.
- [x] **React Error Boundary:** Wrap the core UI layout in a React Error Boundary to catch unexpected rendering exceptions and show a friendly crash recovery screen instead of a blank webview.

### 4. Database & Auth (`/supabase`)
- [x] **Activity Logs:** Create an audit trail to log which member contacted/updated a listing (who, what, when).
- [x] **Row Level Security (RLS) Hardening:** Restrict update policies so that standard `member` users can only update the `status` and `notes` columns, keeping critical data (like `price` and `listing_url`) locked.

### 5. Native OS Integration & App Distribution (`/src-tauri`)
- [x] **Auto-Updater System:** Set up Tauri's built-in updater system in `tauri.conf.json` connected to a release server or GitHub releases list so users automatically get version updates upon launch.
- [x] **Deep Linking for User Invitations:** Integrate `tauri-plugin-deep-link` to handle links like `vatrio://auth?token=...`, letting email invitation links launch the desktop app directly and sign the user in automatically.

---

## 💡 User-added Ideas
*Add your custom feature requests, UI mockups, and notes in this section.*

- [ ] *(Example: Add phone number extraction tool for scraped OLX descriptions)*
- [ ] 
- [ ] 
