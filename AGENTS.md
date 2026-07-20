Agent Instructions — Vatrio Tool

You are implementing backlog items for the Vatrio Tool project (Tauri + React/TS
desktop app, Node/Playwright crawler, Supabase/Postgres backend).

Source of truth

backlog.json is the task list. Each milestone has an id, a title, and a list of
tasks with id, title, status (todo | in_progress | done). Do not invent tasks
outside this file. If you think something is missing, add it to backlog.json
with status todo first, then implement it.

Working loop, per task

Pick the next todo task from the current milestone (default:
m1-crawler-reliability unless told otherwise). Set its status to in_progress in
backlog.json. Implement it as a small, self-contained change. Prefer one task
per commit-worthy unit of work — don't bundle unrelated tasks together. If the
task should have tests, write/update them alongside the change, but do NOT run
the full test/build suite per task — testing is batched to milestone end (see
"Testing — milestone end only" below). Set the task's status to done in
backlog.json once the change is implemented, then commit. Run: node
scripts/backlog-status.mjs m1-crawler-reliability This prints the current
completion percentage for the milestone. Do this after every task, not just at
the end — I want visibility into progress, not just a final number.

Testing — milestone end only

Do not run the test suite or type/build checks per task. Once every task in the
milestone is done, run the full validation exactly once:
  - npm run build                              (frontend: tsc + vite build)
  - cd crawler && npm test && npm run build    (crawler test suite + typecheck)
Fix every failure before going further — including regressions in tasks already
marked done — until both are green. Only then run the release-gate dry run. A
milestone is not releasable while any test or build is failing.

Release gate — read this carefully

The release threshold is 100% (defined in backlog.json as threshold_percent).
After updating backlog status, run: node scripts/release.mjs --milestone
m1-crawler-reliability without --auto. This is a dry run — it tells you whether
the threshold is met and what it would do. It never touches git. If the dry run
reports the threshold is met, stop and tell me. Show me the dry-run output
(proposed version, proposed commit message, task list state) and wait for my
explicit go-ahead before adding --auto. Do not add --auto on your own
initiative, even if the dry run says the threshold is met. I want to review
what's about to be committed before it's pushed — this is a personal project
repo, not a sandbox. Once I confirm, run: node scripts/release.mjs --milestone
m1-crawler-reliability --auto --bump patch (use --bump minor instead if the
milestone represents a meaningfully bigger jump than routine fixes — use your
judgment and say why).

Git hygiene

Never git push --force. Never commit .env or anything matching
__SERVICE_ROLE_KEY_. Never rewrite history on dev or main. If git push fails
(rejected, diverged, auth issue), stop and report the exact error — don't retry
with --force or -u origin HEAD blindly.

Code conventions

TypeScript strict mode, no any unless there's a documented reason. Crawler code
lives in crawler/, desktop app in src/, native shell in src-tauri/. New Supabase
schema changes go in a new numbered .sql migration file, never edited into an
existing one. Match existing code style; don't introduce a new formatter/linter
config without asking.

When you're unsure

If a task is ambiguous (e.g. "add retry with exponential backoff" — which calls,
what max attempts), make a reasonable, documented choice and note it in the
commit message rather than stopping to ask, unless the ambiguity affects data
safety or the release gate.
