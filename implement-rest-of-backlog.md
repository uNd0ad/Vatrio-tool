# Model: Implement the Rest of the Backlog (Gemini / Antigravity)

This is the execution model for finishing `Backlog.json` after milestones **m1**
and **m2** (both 100%). It extends — does not replace — `GEMINI.md` (per-task
rules) and `implement-backlog.md` (single-milestone dispatch). Read those first;
this file adds the multi-milestone orchestration, a mandatory reconciliation
pass, and the house patterns established in recent work.

Backlog snapshot at time of writing:

- **m1** Crawler Reliability — 47/47 done
- **m2** Data Model & Database — 40/40 done
- **m3** Desktop App UX — 9/50 done  ← resume here
- **m4 … m36** — todo (≈ 900 tasks)

---

## Phase 0 — Reconciliation (do this ONCE, before writing any new code)

Recent hand work already implemented things that are still marked `todo`. Do not
rebuild them. Before starting m3, audit the codebase against the backlog and fix
the bookkeeping.

Procedure:

1. For each `todo` task in **m3, m4, m5**, grep the codebase for an existing
   implementation (`src/components/ListingsTable.tsx`, `src/services/`,
   `src/utils/`, `src/components/`).
2. If the implementation **fully** satisfies the task's intent → set it `done`
   and note in the commit which existing code satisfies it. **Never mark `done`
   on a title match alone — verify behavior.**
3. If it's **partial** → either finish it now (preferred, small change) or leave
   it `todo` with a one-line `note` field describing what's missing.

Known candidates (verify each — this list is a starting point, not authority):

| Task | State | Where |
|---|---|---|
| m4-141 Save filter combo as named view | done | `savedViews` util + toolbar UI |
| m4-134/136/139 filter by transaction/status/seller | done | `applyListingFilters` in `services/listings.ts` |
| m4-137 filter by date range | done | `dateRange` filter (server-side) |
| m4-144/145 sort by price / date | done | sort dropdown → server `order` |
| m3-96 search-as-you-type | done | debounced search |
| m3-106 global search bar (⌘K) | partial | ⌘K focuses search; not a full command palette |
| m4-143 clear all filters | partial | reset button covers advanced filters only |
| m4-146 sort by days on market | todo | add to sort options + query |
| m4-147 sort by price-per-sqm | todo | needs computed/generated column or client sort |
| m4-149 remember last sort/filter on relaunch | todo | persist to localStorage |
| m3-104 drag-and-drop Kanban | partial | `KanbanBoard` moves via buttons, not DnD |
| m5-156 new-listing-matches-filter push | partial | desktop notification fires on any realtime insert |
| m3-113 toast notifications save/error | partial | error banners + realtime toast exist |

Also present but possibly unlisted (map to the right milestone before claiming):
Map view (`MapView`, → m20), Kanban board (→ m3), favorites/starring, bulk
soft-delete, days-on-market display, DB-wide status counts.

Commit the reconciliation as its own change:
`chore(backlog): reconcile m3–m5 status with already-implemented features`.

---

## Recommended milestone order

Numeric order is fine, but this dependency/value order is better. Override only
with a reason.

1. **Product core (build on recent work):** m3 → m4 → m5
2. **Trust & correctness:** m6 Auth/User Mgmt → m7 Security/Compliance → m8 Testing/QA
3. **Delivery reliability:** m9 CI/CD → m10 DevOps/Monitoring → m29 Backup/DR → m24 Packaging
4. **Quality of experience:** m11 Performance → m12 Accessibility/Localization → m13 Offline/Sync → m27 Design System
5. **Business features:** m14 Reporting → m15 Export/Import → m16 Client/Deal → m34 Data Quality → m21 Financial Tools
6. **Expansion (lowest priority):** m17–m20, m22, m23, m25, m26, m28, m30–m33, m35, m36

Do **one milestone at a time, end to end**, through its release gate, before
starting the next.

---

## Per-task loop (the contract)

Follow `GEMINI.md` exactly. In short, for each `todo` task in the current milestone:

1. Set status → `in_progress` in `Backlog.json`.
2. Implement the smallest self-contained change. One task per commit-worthy unit.
3. Write/update tests for the new behavior — but **do not run the full test/build
   suite yet**. Testing is batched to milestone end (next section).
4. Set status → `done`. Commit.
5. Run `node scripts/backlog-status.mjs <milestone-id>` and report the percent.

Per-task quality bar (cheap, always): no secrets or large data/API dumps staged
(the repo previously committed a 260 KB `api.txt` dump — never repeat that class
of mistake); no TypeScript `any` without a documented reason; TS strict stays on;
match existing style and the house patterns below.

## Milestone-end validation (run ONCE, before the release gate)

Testing is batched to the end of the milestone, **not per task**. When every task
in the milestone is `done`, run the full validation a single time:

- `npm run build` — frontend `tsc && vite build`, must be clean.
- `cd crawler && npm test && npm run build` — crawler suite + typecheck, must be green.

Fix every failure before continuing — **including regressions in tasks already
marked `done`** — until both are green. Only then run the release-gate dry run. A
milestone is **not releasable** while any test or build is failing.

---

## House patterns (stay consistent with recent work)

- **Filtering/sorting/counts are server-side.** Add new list filters by extending
  `applyListingFilters` and `ListingFilters` in `src/services/listings.ts`, and
  new counts via `fetchListingCounts` — never re-introduce client-side filtering
  over paginated rows (that was a bug this codebase already fixed).
- **Graceful column fallback.** Queries that select newer columns keep a retry
  path for DBs where the migration hasn't been applied (see the `deleted_at`
  fallback and `isMissingColumnError` in `services/listings.ts`).
- **Supabase schema changes** go in a **new** file
  `supabase/migrations/YYYYMMDDHHMMSS_short_description.sql` (see existing names).
  Enable RLS on new tables. Never edit an existing migration.
- **Local-only state** (favorites, saved views, theme, last-used sort) lives in
  `localStorage` behind a `src/utils/*` module with a corresponding test.
- **Releases must stay signed.** The release workflow now *fails* if the signing
  key is missing (unsigned is an explicit opt-in via `ALLOW_UNSIGNED_RELEASE`).
  Do not weaken this or reintroduce a silent unsigned fallback.
- **Romanian UI copy.** User-facing strings are in Romanian; match the tone of
  existing labels.

---

## Release gate (per milestone — unchanged, enforced)

After a milestone's tasks are `done`:

1. Dry run: `node scripts/release.mjs --milestone <id>` (no `--auto`). It never
   touches git.
2. If threshold (100%) is met, **stop** and show the human the dry-run output
   (proposed version, commit message, task state). **Do not** pass `--auto` on
   your own initiative.
3. Only after explicit human approval:
   `node scripts/release.mjs --milestone <id> --auto --bump patch`
   (use `--bump minor` when the milestone is a meaningful feature jump — say why).

Git hygiene: never `--force`, never rewrite history on `dev`/`main`, never commit
secrets. If a push is rejected, stop and report the exact error.

---

## Stop-and-ask conditions

Make a documented reasonable choice for ordinary ambiguity. Stop for the human when:

- A task affects **data safety** (deletes, migrations that drop/rewrite data, RLS changes).
- A task needs a **secret, paid service, or external account** not already configured.
- A task changes **auth, permissions, or the release/signing pipeline**.
- The **release threshold is met** (per the gate above).
- A task looks **out of scope** for the app or conflicts with another task.

---

## Ready-to-paste Antigravity Manager goal (master prompt)

> Work through `Backlog.json` for the Vatrio Tool, following
> `implement-rest-of-backlog.md`, `GEMINI.md`, and `AGENTS.md`.
>
> **First**, do the Phase 0 reconciliation pass: audit m3–m5 `todo` tasks
> against the current codebase, mark genuinely-implemented ones `done` (verify
> behavior, don't title-match), and commit that as
> `chore(backlog): reconcile m3–m5 status`.
>
> **Then** implement milestones in the recommended order, starting with
> **m3-desktop-app-ux**. One task at a time: set `in_progress`, make the smallest
> self-contained change, write tests for it, set `done`, commit, and run
> `node scripts/backlog-status.mjs <id>` after each task — but **do NOT run the
> test/build suite per task**. When the whole milestone is `done`, run the full
> validation once (`npm run build`; `cd crawler && npm test && npm run build`)
> and fix everything green before the release dry run.
>
> Follow the house patterns (server-side filtering/counts, numbered RLS
> migrations, signed releases, Romanian UI copy). Never commit secrets or large
> data dumps.
>
> When a milestone's dry-run release check
> (`node scripts/release.mjs --milestone <id>`, no `--auto`) reports the 100%
> threshold is met, **stop and show me the output**. Do not push or pass
> `--auto` without my explicit go-ahead. Then wait for me before starting the
> next milestone.

### Per-milestone dispatch (if you prefer to drive one at a time)

> Continue with milestone `<id>` in `Backlog.json` per
> `implement-rest-of-backlog.md`. Same per-task loop, testing batched to
> milestone end (validate once with `npm run build` and
> `cd crawler && npm test && npm run build`), same release gate. Stop at the
> dry-run threshold and show me the output.
