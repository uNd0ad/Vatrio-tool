# Vatrio Tool — 1000 Ideas for Improvement

A full backlog, organized by category. Not a roadmap — a menu. Pick what's relevant to where the tool is headed (internal CRM vs. future product) and ignore the rest.

---

## 1. Crawler & Scraping Reliability (1–40)
1. Fallback CSS selectors per site so one DOM change doesn't break scraping
2. Alert (Slack/email) when a crawl run returns 0 results
3. Retry with exponential backoff on failed page loads
4. Snapshot tests against saved HTML fixtures, run in CI
5. "Last successful crawl" timestamp shown in the desktop app
6. Rotate user-agents / realistic headers to reduce blocking
7. Randomized delay between requests to avoid rate limits
8. Detect CAPTCHA/anti-bot pages, skip + alert instead of crashing
9. Build `crawlStoria` module
10. Build `crawlImobiliare` module
11. Cross-site deduplication (same property posted on OLX + Storia)
12. Store raw HTML on parse failure for debugging
13. Dry-run mode for testing selector changes before deploy
14. Cron heartbeat/health-check so you know the job actually ran
15. Version the scraped-data schema so old records don't break new code
16. Proxy rotation for high-volume crawling
17. Headless browser pool management (reuse contexts, don't spawn per-page)
18. Distributed crawling queue if listing volume grows
19. Circuit breaker: pause a site's crawler after N consecutive failures
20. Configurable crawl frequency per site
21. Crawl only changed/new listings (incremental, not full re-scan)
22. Detect and skip promoted/sponsored listings if noise
23. Extract "date posted" and flag stale listings
24. Extract seller type (agency vs. private) automatically
25. Normalize price formats (comma/period, currency symbol variants)
26. Normalize address/zone naming across sites
27. Handle pagination robustly (detect last page correctly)
28. Handle site A/B-tested layouts (multiple selector sets)
29. Screenshot capture on scrape failure for visual debugging
30. Configurable timeout per site to avoid hanging jobs
31. Playwright context isolation to prevent session bleed
32. Memory leak monitoring for long-running headless sessions
33. Auto-restart crawler process on crash (PM2/systemd)
34. Structured logging (JSON) for every crawl run
35. Crawl summary report emailed after each run (new/updated/removed counts)
36. Configurable per-site crawl enable/disable toggle
37. Test selectors against multiple listing categories (apartment/house/land)
38. Handle geo-blocked or region-locked page variants
39. Respect robots.txt and rate limits as a policy default
40. Document selector-maintenance runbook in README

## 2. Data Model & Database (41–80)
41. Price history table instead of overwriting price on update
42. Computed "days on market" field
43. Soft-delete instead of hard delete for expired listings
44. Full-text search index on title/zone
45. Explicit Postgres row-level security policies
46. Supabase CLI migrations instead of loose `.sql` files
47. Indexes on status/zone/price for fast filtering
48. Audit log table (who changed what, when)
49. Fuzzy-match duplicate detection on address/title
50. Store photos in Supabase Storage (not just external links)
51. Free-text "notes" field per listing
52. Tagging/labeling system
53. Lat/lng geocoding for future map view
54. Automated Supabase backup schedule
55. Auto-archive listings inactive for X months
56. `property_type` field extracted from URL/filters (already in TODO)
57. `transaction_type` (rent vs. sale) normalized across sources
58. Currency field for future multi-currency support
59. Foreign key constraints reviewed for cascade behavior
60. Views/materialized views for dashboard queries
61. Partitioning strategy if listings table grows large
62. Enum types for status instead of free text
63. Check constraints on price (no negative values)
64. Trigger to auto-update `updated_at` timestamp
65. Separate `listing_photos` table instead of single photo URL
66. Track crawl source per listing (which site, which run)
67. Historical snapshot table for "what changed" diffing
68. Database-level unique constraint on (source, external_id)
69. Seed script for local dev with realistic sample data
70. Staging Supabase project separate from production
71. Data dictionary / schema documentation page
72. Column comments in SQL for self-documentation
73. Archive table for deleted/expired listings (not permanent delete)
74. Configurable data retention policy per table
75. Referential integrity check script (orphaned records)
76. Nightly data quality report (missing fields, malformed prices)
77. `client_matches` table linking listings to saved client searches
78. `notes_history` table so notes aren't silently overwritten
79. Encrypted column for any future sensitive field
80. Database connection pooling review for crawler + app concurrency

## 3. Desktop App UX (81–130)
81. Map view of listings by zone/coordinates
82. Saved filters/views (e.g. "Timișoara studios under X")
83. Sortable columns (price, date, status)
84. Bulk status updates (multi-select)
85. Keyboard shortcuts for common actions
86. Dark mode
87. Kanban board view by status
88. Desktop notifications for new matching listings
89. Favorites/starred flag separate from status
90. Virtualized list rendering for large datasets
91. Inline image gallery instead of just a link
92. Price-per-sqm auto-calculated and displayed
93. Side-by-side comparison view (2–3 listings)
94. CSV/Excel export for client reporting
95. Dashboard/summary screen (counts by status, new today)
96. Search-as-you-type across all fields
97. Offline mode with local cache + sync on reconnect
98. Undo for accidental status changes/deletes
99. Loading skeletons instead of blank screens
100. Settings screen for crawl frequency, filters, notifications
101. Resizable/reorderable table columns
102. Compact vs. comfortable density toggle
103. Right-click context menu on listings
104. Drag-and-drop status changes on Kanban board
105. Multi-window support (detach a listing into its own window)
106. Global search bar (cmd/ctrl+K style)
107. Recently viewed listings history
108. "New since last visit" highlight/badge
109. Configurable default view on app launch
110. Inline editing of notes without opening a modal
111. Sticky filter bar while scrolling
112. Empty-state illustrations/guidance for new users
113. Toast notifications for save/error confirmations
114. Confirmation dialogs for destructive actions
115. Zoom/scale UI setting for different monitor sizes
116. Status color-coding consistent across all views
117. Quick-filter chips (e.g. "New today", "No response")
118. Print-friendly listing detail view
119. Configurable card vs. table view toggle
120. Auto-refresh interval configurable by user
121. Manual "refresh now" button with visible sync state
122. Listing detail panel (side drawer instead of full navigation)
123. Breadcrumb navigation for nested views
124. Persist window size/position between sessions
125. Multi-monitor awareness (remember which screen it opened on)
126. System tray icon with quick status
127. Minimize-to-tray option
128. Auto-launch on system startup (opt-in)
129. In-app changelog viewer after updates
130. Contextual tooltips on first use of a feature

## 4. Search, Filter & Sort (131–155)
131. Filter by price range (slider)
132. Filter by zone/neighborhood multi-select
133. Filter by property type
134. Filter by transaction type (rent/sale)
135. Filter by source site
136. Filter by status
137. Filter by date range (posted/added)
138. Filter by "has photos"
139. Filter by seller type (agency/private)
140. Combine filters with AND/OR logic
141. Save current filter combo as a named view
142. Share a saved filter link with a teammate
143. "Clear all filters" one-click reset
144. Sort by price ascending/descending
145. Sort by date added
146. Sort by days on market
147. Sort by price-per-sqm
148. Multi-column sort (price then date)
149. Remember last-used sort/filter on relaunch
150. Fuzzy search tolerant of typos
151. Search within notes field
152. Search by exact address match
153. Highlight matching search terms in results
154. Filter presets for common client requests
155. Quick filter for "matches an active client search"

## 5. Notifications & Alerts (156–180)
156. New-listing-matches-filter push notification
157. Price-drop alert as distinct notification type
158. Daily digest email of new listings
159. Weekly summary report
160. Notification preferences per user (channel, frequency)
161. Snooze notifications for X hours
162. Quiet hours / do-not-disturb schedule
163. In-app notification center (bell icon, history)
164. Mark notifications as read/unread
165. Notification badge count on app icon
166. Sound alert toggle
167. Notify master when a member's crawl access errors out
168. Notify on crawler failure (ops alert, not user-facing)
169. Notify when a saved client search gets 0 matches for X days
170. Configurable notification threshold (e.g. only price drops >5%)
171. Digest grouping by zone/client
172. Email template branding consistency
173. SMS alert option for high-priority matches
174. Notification history export
175. Test-notification button in settings
176. Escalation if a "hot lead" listing isn't actioned in 24h
177. Notify when a listing is removed/expired
178. Batch notifications to avoid spam (debounce)
179. Per-client notification opt-in/opt-out
180. Notification delivery confirmation/read receipts

## 6. Auth & User Management (181–210)
181. Password strength requirements on account activation
182. Two-factor authentication for master accounts
183. Session timeout / auto-logout after inactivity
184. Per-user activity log
185. Revoke member access without full account deletion
186. Read-only "viewer" role in addition to master/member
187. Resend invite email if expired
188. Rate limiting on login attempts
189. Admin audit trail for invites/deletions
190. "Forgot password" recovery flow
191. Account deactivation vs. permanent deletion distinction
192. Login history (device, IP, timestamp) visible to user
193. Force password reset on suspected compromise
194. Configurable password expiry policy
195. Session list with "log out other devices" option
196. Email change requires re-verification
197. Invite expiry countdown shown to admin
198. Bulk invite (CSV upload of emails)
199. Custom permission sets beyond master/member
200. Time-limited guest access (e.g. for a contractor)
201. Login via magic link as password alternative
202. Account lockout after N failed attempts
203. Admin impersonation mode for support/debugging (logged)
204. User profile page (name, avatar, preferences)
205. Deactivated user's listings/notes remain attributed correctly
206. Onboarding checklist for newly invited members
207. Terms-of-use acceptance tracking
208. Last-login visibility for admin
209. Self-service password change
210. Configurable session duration per role

## 7. Security & Compliance (211–245)
211. `.env` validation on startup (fail fast if keys missing)
212. Dependency vulnerability scanning (npm audit/Dependabot)
213. Content-Security-Policy headers in Tauri webview config
214. Documented service_role key rotation process
215. Input sanitization on all crawler-parsed text before DB insert
216. Data-processing documentation (even though no personal data stored)
217. Log redaction so keys never appear in logs
218. Pinned dependency versions
219. LICENSE file clarifying internal-use-only status
220. SECURITY.md with responsible disclosure contact
221. Secrets stored in OS keychain, not plaintext config
222. Encrypted local cache if offline mode is added
223. HTTPS enforced for all Supabase calls (verify config)
224. CSRF protection review for Edge Functions
225. Least-privilege Supabase policies per role
226. Regular access review of who has master accounts
227. Explicit statement of what data the crawler does NOT collect
228. Data flow diagram documenting crawler → Supabase → app
229. Periodic manual security review checklist
230. Dependency license compliance check
231. SBOM (software bill of materials) generation
232. Tauri capability/permission scoping reviewed (least privilege)
233. Disable dev tools in production builds
234. Code signing for release binaries
235. Verify Supabase anon key permissions are truly read/limited-write
236. Penetration test before any external rollout
237. Rate limiting on Edge Function endpoints
238. IP allowlisting for admin functions if feasible
239. Encrypted backups
240. Incident response runbook (what to do if a key leaks)
241. GDPR-lite documentation given DPO background, even if no PII stored
242. Explicit retention/deletion policy documented for logs
243. Review third-party npm packages for supply-chain risk
244. Automated secret-scanning in CI (gitleaks/truffleHog)
245. Vulnerability disclosure email monitored regularly

## 8. Testing & QA (246–275)
246. Unit tests for crawler parsing logic
247. Integration tests for Supabase read/write flows
248. E2E tests for the Tauri app (Playwright)
249. Snapshot tests for UI components
250. Test coverage reporting in CI
251. Mock Supabase client for isolated unit tests
252. Test fixtures for each source site's HTML structure
253. Regression test suite run before every release
254. Manual QA checklist for release candidates
255. Cross-platform test pass (Windows/Mac/Linux) before release
256. Load test the crawler against a large mock listing set
257. Test edge cases: malformed price, missing photo, broken link
258. Test Supabase RLS policies with different role tokens
259. Test invite/activation flow end-to-end
260. Test offline mode fallback behavior
261. Test notification delivery across channels
262. Visual regression testing for UI changes
263. Accessibility testing pass (keyboard nav, screen reader)
264. Test database migration rollback
265. Test crawler behavior when a site is fully down
266. Fuzz testing on user input fields
267. Test large dataset performance (10k+ listings)
268. Test concurrent multi-user edits (conflict handling)
269. Test Edge Function auth boundaries (member can't call master ops)
270. Automated smoke test after each deploy
271. Test app behavior with no internet connection at launch
272. Test update/auto-updater flow
273. Beta-tester feedback loop before wider release
274. Bug triage process and labeling convention
275. Flaky test detection and quarantine process

## 9. CI/CD & Release Management (276–305)
276. GitHub Actions CI running tests on every PR
277. Automated build pipeline for release binaries
278. ESLint + Prettier enforced in CI
279. TypeScript type-check as a CI gate
280. Semantic versioning with changelog automation
281. Release notes auto-generated from commit messages
282. Staging environment mirrors production config
283. Pre-commit hooks (lint, format, type-check)
284. PR template with checklist
285. Issue template for bugs vs. feature requests
286. Branch protection rules on `dev`/`main`
287. Automated dependency update PRs (Dependabot/Renovate)
288. Build artifact caching to speed up CI
289. Tagged releases matching GitHub Releases
290. Rollback plan documented for bad releases
291. Canary release process for risky changes
292. Feature branch naming convention documented
293. Commit message convention (Conventional Commits)
294. Automated version bump on merge to main
295. Build matrix testing multiple Node versions
296. Release checklist (migrations run? env vars set? etc.)
297. Draft release notes reviewed before publishing
298. Deployment approval gate for production Edge Functions
299. Automated Rust/Tauri toolchain version pinning
300. CI badge in README showing build status
301. Nightly build for internal testing
302. Hotfix branch process documented
303. Post-release smoke test automated
304. Changelog published in-app, not just GitHub
305. Deprecation notices for breaking changes

## 10. DevOps & Monitoring (306–335)
306. Uptime monitoring for crawler cron (healthchecks.io)
307. Error tracking (Sentry) for crawler and desktop app
308. Structured JSON logging throughout
309. Alert when crawl run count drops unexpectedly
310. Step-by-step Railway/Render deployment doc in README
311. Staging cron schedule separate from production
312. Supabase usage/cost monitoring dashboard
313. Auto-restart policy if crawler process crashes
314. Centralized log aggregation (even simple: Supabase table + view)
315. Dashboard for crawler run history and success rate
316. Alert thresholds configurable without code change
317. Resource usage monitoring (memory/CPU) for crawler host
318. Disk space monitoring on crawler host
319. Dependency outage detection (Supabase status page check)
320. On-call escalation plan (even if it's just you + neighbor mechanic joke aside, document it)
321. Runbook for "crawler is down" scenario
322. Runbook for "Supabase quota exceeded" scenario
323. Synthetic monitoring: scheduled test crawl to verify pipeline health
324. Log retention policy defined
325. Metrics for average crawl duration over time
326. Alert on abnormal crawl duration (too fast = likely broken)
327. Dashboard for listings-added-per-day trend
328. Weekly ops summary auto-generated
329. Version/build info visible in app "About" screen
330. Crash report auto-submission (opt-in)
331. Telemetry opt-out clearly available
332. Self-hosted privacy-friendly analytics (Plausible) if usage tracking desired
333. Feature usage tracking to inform prioritization
334. Cost alerting if hosting bill exceeds threshold
335. Documented disaster scenario: what if Supabase account is lost

## 11. Performance & Optimization (336–365)
336. Debounced search input to reduce query load
337. Optimistic UI updates for status changes
338. Lazy-load images in listing cards
339. Virtual scrolling for long lists
340. Code splitting to reduce initial bundle size
341. Bundle size budget enforced in CI
342. Startup time profiling and optimization
343. Memory usage profiling for long-running sessions
344. Query optimization pass on slow dashboard queries
345. Caching layer for frequently accessed aggregate stats
346. Image compression/resizing before storage
347. CDN for stored listing photos
348. Reduce re-renders via memoization in React components
349. Batch Supabase writes instead of one-by-one
350. Connection pooling tuning for crawler concurrency
351. Precompute dashboard stats via scheduled job instead of live query
352. Paginate API/database queries instead of fetching all rows
353. Index tuning based on actual query patterns (EXPLAIN ANALYZE)
354. Reduce Tauri binary size (strip unused features)
355. Lazy-load non-critical UI panels
356. Web worker offloading for heavy client-side filtering
357. Avoid N+1 queries in listing detail view
358. Cache client-side filter results between navigations
359. Prefetch likely-next-view data
360. Throttle real-time subscription updates to avoid UI thrash
361. Profile and reduce Tauri IPC call overhead
362. Reduce cold-start time for the desktop app
363. Optimize crawler concurrency (parallel vs. sequential per site)
364. Load-test Supabase Edge Functions under invite-storm scenario
365. Periodic performance regression testing in CI

## 12. Accessibility & Localization (366–390)
366. Full keyboard-only navigation support
367. Screen reader testing pass
368. ARIA labels on interactive elements
369. Color contrast compliance (WCAG AA minimum)
370. Focus management on modal open/close
371. Skip-to-content link for keyboard users
372. Resizable font/UI scale setting
373. High-contrast theme option
374. Error messages clearly associated with form fields
375. Non-color-only status indicators (icons + text, not just color)
376. Romanian/English language toggle
377. Localized date/number formatting
378. Localized currency formatting (RON primary)
379. Translation file structure (i18n-ready) even if RO-only for now
380. Right-aligned layout consideration if future languages need it
381. Accessible tooltips (not hover-only, keyboard-triggerable)
382. Reduced-motion setting for animations
383. Alt text for all listing images
384. Accessible table markup (proper headers/scope)
385. Voice-over testing on Mac build
386. NVDA/JAWS testing on Windows build
387. Consistent heading hierarchy for screen readers
388. Form validation announced to assistive tech
389. Accessible drag-and-drop (Kanban) with keyboard alternative
390. Localization QA pass with a native speaker review

## 13. Offline & Sync (391–410)
391. Local SQLite cache for offline browsing
392. Queue status changes made offline, sync on reconnect
393. Conflict resolution UI for concurrent offline edits
394. Visual indicator when app is in offline mode
395. Background sync on reconnect without user action
396. Manual "force sync" button
397. Partial sync (only changed records) instead of full refetch
398. Offline-first architecture evaluation (vs. current online-first)
399. Local cache expiry policy
400. Sync conflict log for review
401. Retry queue for failed sync operations
402. Sync status indicator per record (synced/pending/failed)
403. Configurable sync interval
404. Bandwidth-aware sync (skip images on metered connection)
405. Delta sync using `updated_at` timestamps
406. Last-write-wins vs. merge strategy decision documented
407. Offline note-taking with sync-on-reconnect
408. Local backup export in case of prolonged outage
409. Graceful degradation of features requiring network
410. Sync health dashboard (last sync time per user)

## 14. Reporting & Analytics (411–440)
411. Weekly market snapshot report (avg price/sqm by zone)
412. Conversion rate by source site
413. Average time-to-contact metric
414. New-listings-per-day trend chart
415. Status funnel visualization (New → Contacted → Closed)
416. Client-specific match report
417. Exportable PDF report for client meetings
418. Custom date-range reporting
419. Zone-level price trend over time
420. Agency vs. private-seller ratio report
421. Listing lifespan analysis (avg days on market by zone/type)
422. Price-drop frequency report
423. Crawler performance report (success rate by site)
424. Team activity report (who actioned what)
425. Deal pipeline value report (if commission tracking added)
426. Scheduled report delivery via email
427. Report template customization
428. Comparative report: this month vs. last month
429. Top zones by listing volume
430. Report export to Excel with formatting
431. Chart visualizations embedded in dashboard (not just tables)
432. Drill-down from summary chart to underlying listings
433. Report sharing via secure link
434. Historical trend archive (year-over-year comparison)
435. Custom KPI builder for advanced users
436. Report scheduling per recipient
437. Print-optimized report layout
438. Data freshness indicator on every report
439. Report versioning (know which data snapshot a report used)
440. Benchmark report against public market indices if available

## 15. Export, Import & Documents (441–465)
441. CSV export of filtered listing set
442. Excel export with formatted columns
443. PDF export of single listing detail sheet
444. Batch PDF generation for a client shortlist package
445. Watermarking on exported client documents
446. Branded export templates (logo, colors)
447. Import listings manually via CSV (for non-crawled sources)
448. Bulk import validation with error reporting
449. Export includes photos as embedded thumbnails in PDF
450. Configurable export field selection
451. Export history log (what was exported, when, by whom)
452. Scheduled automatic export to a folder/cloud drive
453. Integration with Google Drive for auto-backup of exports
454. Export client shortlist as a shareable public link
455. QR code generation linking to a listing detail page
456. Print-friendly single-listing view
457. Export filter/view definitions (not just data) for reuse
458. JSON export for programmatic use
459. Export audit log for compliance
460. Document attachment support per listing (contracts, photos)
461. File size limits and validation on uploads
462. Virus scanning on uploaded documents
463. Version history for attached documents
464. Bulk document download (zip) for a listing set
465. Document expiry reminders (e.g. offer valid until date)

## 16. Client & Deal Management (466–505)
466. Client contact record (kept separate/compliant from listing data)
467. Link listings to specific client search profiles
468. Automated email/SMS alert on new match for a client
469. Lead scoring based on match quality and recency
470. Commission/deal tracking once a listing converts
471. Deal pipeline stages (Offer → Negotiation → Closed)
472. Client interaction timeline (calls, emails, viewings)
473. Client preference profile builder (budget, zone, must-haves)
474. Automated shortlist generation for a client
475. Client portal (external-facing, read-only shortlist view)
476. Viewing appointment scheduling per listing
477. Offer tracking with amount/date/status
478. Counter-offer history log
479. Deal closing checklist per transaction
480. Commission split calculator for co-brokered deals
481. Tax estimate calculator for deal value
482. Client satisfaction follow-up after closing
483. Referral source tracking per client
484. Client tagging (investor, first-time buyer, renter)
485. Duplicate client detection
486. Client communication templates (email/SMS)
487. Reminder tasks tied to specific clients
488. Client search alert frequency customization
489. Multi-client comparison of matched listings
490. Client document vault (ID copies, proof of funds — with compliance care)
491. GDPR-compliant client data handling documentation
492. Client consent tracking for marketing communications
493. Client relationship "temperature" indicator (hot/warm/cold lead)
494. Automated re-engagement reminder for dormant clients
495. Client-specific notes separate from listing notes
496. Deal value forecasting based on pipeline stage
497. Win/loss reason tracking on closed-lost deals
498. Client referral reward tracking
499. Integration point for future e-signature on offers
500. Client anniversary/follow-up reminder (e.g. one year post-purchase)
501. Multi-agent deal collaboration (if team grows)
502. Client-facing status updates (automated "still active" pings)
503. Deal timeline visualization
504. Historical deal archive with searchable notes
505. Client NPS/feedback survey after deal close

## 17. Property Management Module — future expansion (506–540)
506. Owner portal for landlords
507. Tenant portal for renters
508. Rent payment tracking
509. Maintenance request submission and tracking
510. Expense tracking per property
511. ROI dashboard per managed property
512. Portfolio view across all managed properties
513. Tax document generation for owners
514. Year-end financial summary per property
515. Vendor/contractor directory
516. Service request routing to vendors
517. Inspection scheduling and digital checklist
518. Photo documentation for move-in/move-out inspections
519. Damage report generation with photo evidence
520. Security deposit tracking and reconciliation
521. Insurance document storage per property
522. Warranty tracking for appliances/systems
523. Appliance inventory per property
524. Utility account tracking per property
525. Move-in/move-out checklist digitization
526. Key/access log per property
527. Lease renewal reminder automation
528. Rent increase calculator (legal caps where applicable)
529. Late payment reminder automation
530. Multi-unit building support (grouped properties)
531. Occupancy rate dashboard
532. Vacancy duration tracking
533. Property condition history log
534. Recurring maintenance schedule (HVAC service, etc.)
535. Owner statement auto-generation (monthly)
536. Tenant screening workflow integration
537. Smart lock/IoT integration (long-term, optional)
538. Energy usage monitoring integration (long-term, optional)
539. Multi-currency support for foreign property owners
540. Property performance benchmarking against portfolio average

## 18. Integrations — Calendar, Email, Messaging (541–575)
541. Google Calendar sync for viewing appointments
542. Outlook Calendar integration
543. Calendly-style booking link for client viewings
544. Email inbox integration to log client correspondence
545. WhatsApp Business API integration for client alerts
546. Telegram bot for personal notification delivery
547. SMS gateway integration (Twilio or Romanian provider)
548. Automated follow-up email sequences
549. Meeting notes auto-attached to client record
550. Two-way calendar sync (block time when viewing scheduled)
551. Email template library for common client scenarios
552. Zapier/Make webhook triggers for custom automations
553. Slack integration for internal team alerts (if team grows)
554. Integration with Clavium.ro for cross-referencing listings
555. Integration with Cheia.ro for e-contract signing handoff
556. ANAF lookup integration for verifying seller company status
557. ONRC company registry lookup for seller verification
558. Biroul de Credit integration for tenant screening (property mgmt)
559. DocuSign or similar e-signature integration for offers
560. Google Drive integration for document storage/backup
561. Microsoft 365 integration as an alternative
562. Public listing site auto-posting (Cheia.ro, own site)
563. Social media auto-posting for new curated listings
564. Website widget embed for showcasing active listings
565. SEO-optimized public listing pages if externally facing
566. Import contacts from phone/Google Contacts
567. Two-way sync with a dedicated task manager (Todoist/Reminders)
568. Voice assistant integration for hands-free status updates (future)
569. Browser bookmarklet to quick-save a listing from any site
570. Integration with Romanian notary scheduling systems if available
571. Currency exchange rate API for foreign client pricing
572. Weather API integration for viewing-day planning (nice-to-have)
573. Public transit API for walkability/commute info per listing
574. Mortgage lender API integration for rate estimates
575. Integration marketplace page listing all available connectors

## 19. AI & Automation Features (576–610)
576. Auto-summarize long listing descriptions
577. Auto-tag listings by inferred features (balcony, parking, renovated)
578. Duplicate/near-duplicate listing detection via embedding similarity
579. Price anomaly detection ("too good to be true" flag)
580. Automated valuation estimate based on comparable listings
581. Natural-language search ("2-bedroom near center under 80k")
582. AI-drafted client follow-up email suggestions
583. AI-generated weekly market summary text
584. Photo quality auto-scoring to flag poor listings
585. Automatic translation of listing descriptions for foreign clients
586. Sentiment/urgency detection in seller descriptions ("must sell fast")
587. Smart matching algorithm ranking listings by client fit
588. Chat-based query interface over the listings database
589. Local LLM option for privacy-sensitive processing (fits existing interest)
590. AI cost/usage monitoring dashboard for API calls
591. Caching of AI responses to avoid redundant API costs
592. Fallback to rule-based logic when AI service is unavailable
593. Confidence scoring shown alongside AI-suggested tags
594. Human-in-the-loop review queue for AI classifications
595. Auto-extract floor/room count from unstructured description text
596. Auto-flag likely-fraudulent or scam listings
597. AI-assisted comparable sales analysis (comps generation)
598. Voice-to-text note dictation while driving between viewings
599. Auto-generate client-facing property blurbs from raw data
600. Predictive "likely to sell fast" scoring
601. AI-based image tagging (room type recognition from photos)
602. Automated OCR for scanned property documents
603. AI-suggested optimal follow-up timing per client
604. Explainability panel for any AI-driven recommendation
605. Opt-out toggle for AI features (manual mode always available)
606. Rate-limited AI calls to control cost predictably
607. AI-assisted contract clause suggestions (tie to rental contract work)
608. Anomaly detection on crawler output (structural drift alert)
609. AI model version pinning for reproducible outputs
610. Periodic AI feature cost/value review

## 20. Maps & Location Data (611–635)
611. Interactive map view with listing pins
612. Cluster markers when zoomed out on dense areas
613. Draw-a-radius search ("within 2km of this point")
614. Walkability score display per listing
615. Public transit proximity data
616. School catchment area overlay
617. Noise level data overlay (if public data available)
618. Flood risk data overlay
619. Neighborhood amenity density (shops, parks, gyms)
620. Commute-time calculator to a specified work address
621. Satellite/street view toggle on map
622. Save a custom search area shape (not just radius)
623. Heatmap of price-per-sqm by zone
624. Heatmap of listing density by zone
625. Zone boundary overlays matching official district lines
626. Distance-to-nearest-metro/bus-stop calculation
627. Address autocomplete using a geocoding API
628. Reverse geocoding to auto-fill zone from coordinates
629. Map-based client search area drawing tool
630. Historical zone price trend chart accessible from map
631. Nearby comparable listings shown on map for context
632. Offline map tile caching for field use
633. Custom map pin icons by status
634. Multi-listing route planning for a day of viewings
635. Export a day's viewing route to Google Maps/Waze

## 21. Financial Tools & Calculators (636–660)
636. Mortgage payment calculator
637. Rental yield calculator
638. ROI calculator for investment properties
639. Break-even calculator for buy-vs-rent decisions
640. Tax estimate calculator for transaction value
641. Commission calculator with configurable rate
642. Currency converter for foreign-currency listings
643. Notary and registration fee estimator (Romania-specific)
644. Renovation cost estimator based on property condition
645. Cash-flow projection for rental properties
646. Loan-to-value calculator
647. Affordability calculator based on client income
648. Comparable sales price-per-sqm benchmark tool
649. Amortization schedule generator
650. Property tax estimate by zone
651. Utility cost estimator by property size/type
652. Total cost of ownership calculator
653. Investment property cap rate calculator
654. Inflation-adjusted historical price comparison
655. Currency risk indicator for foreign buyers
656. Configurable calculator assumptions (interest rate, tax rate)
657. Save calculator results attached to a client record
658. Export calculator results as a client-facing PDF
659. Side-by-side financial comparison of two properties
660. Sensitivity analysis (what if interest rate changes by 1%)

## 22. Multi-company / Multi-tenant Support (661–680)
661. Support multiple companies under one account (FH Holdings + future ventures)
662. Company-level branding (logo, colors) per workspace
663. Data isolation between companies (strict RLS boundaries)
664. Switch-company selector in the app UI
665. Per-company billing/usage tracking if productized
666. Per-company crawler configuration (different target sites/zones)
667. Per-company user management independent of other companies
668. Shared listing pool option for companies that want to collaborate
669. Company-level default settings and templates
670. Cross-company reporting for the account owner only
671. Company onboarding wizard for new workspaces
672. Company deletion/export flow (data portability)
673. Per-company API keys if external integrations added
674. Company-level audit log
675. White-label option if tool is ever offered to other agents
676. Company subscription tier if monetized later
677. Company-specific notification sender identity (from-email/name)
678. Company-level backup and restore
679. Company usage limits configurable (listings, users, crawls)
680. Company support ticket routing if multi-tenant support grows

## 23. Browser Extension & Mobile Companion (681–705)
681. Browser extension to save a listing directly from OLX/Storia page
682. One-click "add to Vatrio" button injected into listing pages
683. Extension auto-fills metadata from the current page
684. Mobile companion app (React Native/Flutter) for on-the-go access
685. Mobile push notifications for new matches
686. Mobile camera integration for quick property photos on-site
687. Mobile voice note attachment while walking a property
688. Mobile-optimized quick status update (swipe actions)
689. PWA version as a lighter alternative to a full mobile app
690. QR code scan to open a specific listing on mobile
691. Mobile offline mode for viewings in poor-signal areas
692. Mobile GPS check-in when arriving at a viewing
693. Mobile-friendly client shortlist sharing
694. Tablet-optimized layout for in-office kiosk use
695. Mobile biometric login (Face ID/fingerprint)
696. Mobile widget showing today's viewing schedule
697. Mobile-to-desktop handoff (start on phone, continue on desktop)
698. Extension badge showing match count for saved searches
699. Extension respects the "no personal data" principle already in place
700. Mobile dark mode matching desktop app
701. Mobile deep-linking from notification to listing detail
702. Mobile app store listing prep (icons, screenshots) if published
703. Mobile crash reporting
704. Mobile app auto-update mechanism
705. Cross-device sync status indicator

## 24. Packaging & Distribution (706–730)
706. Auto-updater for the Tauri desktop app
707. Delta updates to reduce download size
708. Update rollback capability if a release is bad
709. Staged rollout of updates (percentage-based)
710. In-app changelog shown after an update installs
711. Silent background updates option
712. Manual "check for updates" button
713. Code signing for Windows builds
714. Code signing and notarization for Mac builds
715. MSI installer for Windows
716. DMG installer for Mac
717. AppImage packaging for Linux
718. Distribution via winget (Windows package manager)
719. Distribution via Homebrew (Mac package manager)
720. Portable/no-install version for restricted environments
721. Offline installer bundle (no internet needed for first install)
722. Installer size optimization
723. Uninstaller that cleans up local cache properly
724. Version compatibility check between app and Supabase schema
725. Release channel selection (stable/beta) for testers
726. Automated build for all three platforms per release
727. Build reproducibility documentation
728. First-run setup wizard bundled with installer
729. License/EULA acceptance on first install
730. Crash-safe update process (won't brick the app mid-update)

## 25. API & Extensibility (731–755)
755... 
731. Public REST API for third-party integrations
732. API key generation and management UI
733. Rate limiting per API key
734. API documentation (OpenAPI/Swagger)
735. Webhook support for external systems (new listing, status change)
736. Webhook retry logic with exponential backoff
737. GraphQL endpoint as an alternative query interface
738. API versioning strategy for backward compatibility
739. Sandbox/test API keys separate from production
740. API usage dashboard per key
741. Scoped API permissions (read-only vs. read-write keys)
742. Plugin architecture for custom crawler sources
743. Plugin architecture for custom export formats
744. Community-contributed site-crawler template
745. Configuration-driven site crawler (add a site via config, not code)
746. Internal scripting console for power-user automation
747. Custom field definitions via API without app redeploy
748. API changelog and deprecation notices
749. API client SDK (JS) for easier integration
750. Zapier app listing if productized
751. Make.com (Integromat) integration if productized
752. IFTTT-style simple automation rules in-app
753. Event bus architecture for internal feature decoupling
754. API rate-limit headers for client-side backoff
755. Developer portal page if the API is ever public

## 26. Team Collaboration (756–780)
756. Shared notes visible to all team members on a listing
757. @mention system in notes to tag a teammate
758. Activity feed showing recent team actions
759. Presence indicator (who else is viewing this listing now)
760. Assign a listing to a specific team member
761. Task creation tied to a listing ("call seller by Friday")
762. Team task dashboard (my tasks / all tasks)
763. Internal comments thread per listing (separate from client-facing notes)
764. Team performance dashboard (listings actioned, deals closed)
765. Shift/coverage calendar if multiple agents share leads
766. Round-robin lead assignment for new matches
767. Team-wide saved searches vs. personal saved searches
768. Conflict alert if two members contact the same seller
769. Team announcement/broadcast feature
770. Shared document library for contract templates
771. Team onboarding guide built into the app
772. Permission to lock a listing while actively working it
773. Team leaderboard (optional, opt-in) for closed deals
774. Cross-team handoff notes when reassigning a client
775. Team calendar view of all scheduled viewings
776. Escalation path for stuck/unresponsive leads
777. Team-wide notification digest (daily summary)
778. Role-based dashboard views (agent vs. admin)
779. Internal knowledge base for team process documentation
780. Team retrospective notes tied to closed/lost deals

## 27. Design System & Theming (781–800)
781. Documented design tokens (spacing, color, typography)
782. Component library with consistent styling
783. Storybook setup for isolated component development
784. Light/dark theme built on shared design tokens
785. Custom accent color per company (multi-tenant branding)
786. Consistent icon set across the app
787. Typography scale documented and enforced
788. Motion/animation guidelines (subtle, purposeful only)
789. Empty-state illustration set
790. Error-state illustration set
791. Consistent button hierarchy (primary/secondary/destructive)
792. Form component library with built-in validation states
793. Consistent spacing grid across all screens
794. Responsive breakpoints documented for window resizing
795. Accessible color palette validated for contrast
796. Loading-state component library (skeletons, spinners)
797. Consistent status badge component with color mapping
798. Design QA checklist before merging UI changes
799. Visual regression testing tied to the design system
800. Brand style guide document for external-facing materials

## 28. Legal & Documentation (801–825)
801. Internal-use license clarified in LICENSE file
802. CONTRIBUTING.md if others join development
803. CODE_OF_CONDUCT.md if the project grows a team
804. Architecture decision records (ADRs) for major choices
805. README kept current with each major feature addition
806. API documentation kept in sync with actual endpoints
807. Data-processing statement documenting the "no PII" design choice
808. Terms of use if the tool is ever shared beyond personal use
809. EULA if distributed as installable software to others
810. Onboarding documentation for a new team member
811. Runbook documentation for common operational tasks
812. Glossary of domain terms (status names, field meanings)
813. Decision log for crawler site-support prioritization
814. Versioned documentation matching app release versions
815. FAQ document for common setup issues
816. Troubleshooting guide for failed crawls
817. Database schema diagram kept up to date
818. System architecture diagram kept up to date
819. Changelog maintained per release
820. Style guide for commit messages and PR descriptions
821. Documented backup/restore procedure
822. Documented incident response procedure
823. Documented key-rotation procedure
824. Privacy-by-design rationale documented for future audits
825. Third-party license attributions compiled

## 29. Backup & Disaster Recovery (826–845)
826. Automated daily Supabase backups
827. Backup restore drill performed periodically
828. Off-site backup copy (not just Supabase's own backup)
829. Documented RPO/RTO targets
830. Point-in-time recovery capability verified
831. Backup of Edge Function source code separate from git (belt and suspenders)
832. Backup of environment variable configuration (securely)
833. Disaster recovery runbook: "Supabase project deleted, now what"
834. Backup verification job (confirm backup file isn't corrupt)
835. Local export snapshot as a lightweight personal backup
836. Documented recovery contact/escalation for Supabase support
837. Backup retention policy (how many days/weeks kept)
838. Encrypted backup storage
839. Backup access restricted to master role only
840. Quarterly disaster-recovery tabletop exercise
841. Redundant crawler hosting (failover if Railway/Render is down)
842. Domain/DNS backup configuration documented
843. Recovery time tested end-to-end at least once
844. Backup of user invite/auth configuration
845. Automated alert if a scheduled backup fails to run

## 30. Onboarding & Help (846–865)
846. Guided first-run tutorial for new users
847. Interactive tooltip tour of main features
848. Sample/demo data toggle for exploring the app risk-free
849. In-app help search
850. Contextual help links next to complex settings
851. Video walkthrough for initial Supabase + crawler setup
852. Quick-start checklist visible until completed
853. In-app feedback widget
854. Feature-request submission form
855. Known-issues page linked from the app
856. Setup wizard validating Supabase connection before finishing
857. Setup wizard testing crawler connectivity before finishing
858. Troubleshooting assistant for common first-run errors
859. "What's new" panel highlighting recent updates
860. Contextual empty-state guidance ("no listings yet — run your first crawl")
861. Progressive disclosure of advanced settings (hide until needed)
862. Onboarding email sequence for newly invited members
863. In-app support chat placeholder (even if just a mailto link initially)
864. Glossary tooltips for domain-specific terms in the UI
865. Post-onboarding survey to catch friction points early

## 31. Feature Flags & Experimentation (866–880)
866. Feature flag system for gradual rollout of risky changes
867. Opt-in beta feature toggle in settings
868. A/B testing framework for UI changes (if user base grows)
869. Kill-switch for any feature causing production issues
870. Per-user feature flag overrides for testing
871. Flag-gated AI features so they can be disabled without a release
872. Experiment tracking log (what was tested, outcome)
873. Gradual percentage rollout capability
874. Flag configuration via remote config (no redeploy needed)
875. Flag cleanup process (remove stale flags after full rollout)
876. Internal-only flags for dogfooding new features first
877. Flag documentation so it's clear what each one controls
878. Flag-based emergency disable for the AI cost-control layer
879. Environment-specific default flag states (dev/staging/prod)
880. Flag audit to prevent permanently-orphaned dead code paths

## 32. Romania-specific Integrations (881–900)
881. ANAF fiscal status lookup for verifying seller companies
882. ONRC company registry integration for due diligence
883. Biroul de Credit integration for tenant/buyer screening
884. Cadastru/ANCPI integration for property record verification
885. Notary public directory integration for scheduling
886. Romanian address validation/normalization service
887. CNP-free workflow validation (ensure no personal ID numbers ever stored)
888. Local court registry check for property litigation flags
889. Romanian VAT/tax rate auto-application in calculators
890. Local energy performance certificate (certificat energetic) tracking
891. Romanian rental law compliance checklist built into lease tools
892. Integration with Romanian e-Factura if invoicing is added
893. SPV (Spațiul Privat Virtual) reference documentation for fiscal steps
894. Local bank transfer reference generator for deposits/commissions
895. Romanian postal code validation
896. County (județ) based zone hierarchy in filters
897. Local market data source integration (if a public API exists)
898. Romanian public holiday calendar awareness for scheduling
899. Local currency (RON) as default with EUR as secondary option
900. Compliance checklist aligned with Romanian real estate intermediation regulations

## 33. Rental & Lease Management Extension (901–925)
901. Digital lease generation using existing contract template work
902. Lease clause library with compliant Romanian Labor/Civil Code language
903. Lease renewal reminder automation
904. Lease termination notice generator
905. Security deposit calculation and tracking per lease
906. Rent indexation calculator (inflation-linked adjustments)
907. Tenant application intake form
908. Reference/background check workflow for prospective tenants
909. Co-signer/guarantor tracking on a lease
910. Multi-tenant (roommate) lease support
911. Lease document e-signature integration
912. Lease expiry dashboard across all managed properties
913. Automated rent-due reminder to tenants
914. Late-payment fee calculator per lease terms
915. Lease amendment tracking (addenda log)
916. Move-in inspection report tied to lease start
917. Move-out inspection report tied to lease end
918. Deposit return calculation with deduction itemization
919. Lease renewal negotiation notes/history
920. Comparable rent analysis to inform renewal pricing
921. Lease document version history
922. Tenant communication log tied to the lease record
923. Early-termination clause calculator (penalty estimation)
924. Multi-year lease escalation schedule
925. Lease portfolio summary report for property owners

## 34. Data Quality & Deduplication (926–945)
926. Address normalization pipeline (standardize street/zone naming)
927. Fuzzy duplicate detection across sources using string similarity
928. Image similarity search to catch re-posted listings
929. Automated flag for listings missing key fields
930. Data completeness score per listing
931. Manual merge tool for confirmed duplicates
932. Price outlier detection (flag for manual review)
933. Listing description spam/gibberish detection
934. Auto-correction suggestions for common data entry inconsistencies
935. Periodic data quality audit report
936. Source-reliability scoring (which site tends to have stale data)
937. Configurable data validation rules per field
938. Historical data cleanup script for legacy bad records
939. Standardized enum values enforced at ingestion, not just DB constraint
940. Data lineage tracking (which crawl run produced this record)
941. Automated re-verification of stale listings (re-crawl to confirm still active)
942. Confidence score on auto-extracted fields (property type, transaction type)
943. Manual override flag protecting a record from auto-updates
944. Data quality dashboard visible to admins
945. Deduplication merge history log for auditability

## 35. Multi-channel Notification Delivery (946–960)
946. Email delivery via transactional provider (Postmark, already in use for invites)
947. SMS delivery via Romanian-compatible gateway
948. WhatsApp Business API delivery channel
949. Telegram bot delivery channel
950. Push notification delivery to mobile companion app
951. Desktop native notification delivery
952. In-app notification center as a unified inbox
953. Per-channel delivery preference per notification type
954. Delivery failure fallback (SMS if email bounces)
955. Notification delivery analytics (open/click rates where applicable)
956. Unsubscribe/opt-out handling per channel
957. Test-send capability for each channel from settings
958. Channel-specific formatting (short SMS vs. rich email)
959. Delivery rate limiting to avoid provider throttling/blocking
960. Notification queue with priority levels (urgent vs. digest)

## 36. Miscellaneous & Nice-to-Haves (961–1000)
961. In-app pomodoro/focus timer for prospecting sessions
962. Keyboard shortcut cheat-sheet overlay (press "?")
963. Configurable app icon/theme per season or personal preference
964. Easter egg changelog entries for fun on major releases
965. "On this day" retrospective (listings from a year ago)
966. Personal productivity stats (listings reviewed per day)
967. Custom desktop wallpaper generator with market stats (fun extra)
968. Integration with a personal task manager for cross-tool todos
969. Quick-note capture widget accessible from system tray
970. Configurable startup dashboard (choose what greets you)
971. "Focus mode" hiding all but the active task
972. Client birthday/anniversary reminder for relationship maintenance
973. Randomized daily market fact/tip on the dashboard
974. Export personal usage stats for self-review
975. Built-in unit converter (sqm to sqft for foreign clients)
976. Built-in simple currency ticker for quick reference
977. Configurable app name/branding for future rebrand flexibility
978. "Time since last contact" indicator per client
979. Auto-generated weekly personal recap email
980. Configurable default currency and measurement units
981. Built-in simple CRM export to industry-standard formats
982. Support for attaching voice memos to any record
983. Dark-mode-aware chart color palettes
984. Print stylesheet optimized for A4 (Romanian standard)
985. Configurable working hours to avoid after-hours notifications
986. "Do not contact" flag with reason logging for problematic leads
987. Simple built-in expense log for business-related costs (fuel, tolls to viewings)
988. Mileage tracker for viewing trips (tax deduction support)
989. Integration hook for future accounting software sync
990. Configurable data export schedule to personal archive
991. Built-in changelog RSS feed for personal tracking
992. Optional anonymous usage stats to guide your own prioritization
993. Simple built-in poll/survey tool for client feedback
994. Customizable dashboard widgets (drag to rearrange)
995. "Quiet week" summary if no new listings matched (reassurance, not just alerts)
996. Built-in glossary of Romanian real estate terms for foreign clients
997. Configurable default view per device (desktop vs. laptop)
998. End-of-year retrospective report (deals closed, listings tracked)
999. Personal goal-tracking (e.g. deals-per-quarter target) with progress bar
1000. A genuinely optional "celebrate a closed deal" confetti animation, because why not