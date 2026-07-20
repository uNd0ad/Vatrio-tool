# Legacy SQL (pre-CLI baseline)

These files are the database's history from **before** Supabase CLI migration
tracking existed. They were applied by hand (SQL editor) to the live project.

**Do not replay them and do not add new ones here.** They are kept only as a
baseline reference for how the schema was originally built. The current source
of truth is `supabase/migrations/` (see `../MIGRATIONS.md`).

The timestamped migrations in `supabase/migrations/` assume this baseline was
already applied — migration `20260719000700` is the first CLI-managed change.

## Contents

- `supabase_schema.sql` — original full schema (listings table, indexes, RLS),
  hand-run in the SQL editor.
- `001_…` – `006_…` — the first sequential-numbered migrations.
- `*_migration.sql` — ad-hoc named scripts (activity logs, deduplication,
  sources, RLS hardening, auth, seller/transaction type, master accounts).

Later, superseding definitions for the same objects live in
`supabase/migrations/` (e.g. RLS is re-expressed in
`20260719001100_explicit_row_level_security.sql`). Where they overlap, the
timestamped migration wins.
