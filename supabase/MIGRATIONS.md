# Supabase CLI migration workflow

Timestamped files in `supabase/migrations/` are the source of truth for new
database changes. Create future migrations with:

```sh
supabase migration new descriptive_name
```

## Directory layout

| Path | What it is |
| --- | --- |
| `supabase/migrations/` | **Source of truth.** Timestamped, CLI-managed migrations applied in order. Each has a matching test that reads it by path — never rename or move these. |
| `supabase/legacy/` | Historical, pre-CLI SQL kept as a baseline reference. **Do not replay.** See `supabase/legacy/README.md`. |
| `supabase/seed.sql` | Seed data for `supabase db reset`. |
| `supabase/config.toml` | Local Supabase CLI config. |
| `supabase/functions/` | Edge functions (e.g. `manage-users`). |
| `supabase/email-templates/` | Auth email templates. |

Do not add new schema anywhere except a new timestamped file in
`supabase/migrations/`. Loose `.sql` files at the repo root or in `supabase/`
root are not tracked by the CLI and should not be created.

Validate locally with `supabase start` and `supabase db reset`, then deploy to a
linked staging project with `supabase db push`. Review the generated diff before
deploying production.

## Existing project adoption

The `001` through `006` files and the older named SQL scripts (now collected in
`supabase/legacy/`) were applied manually before CLI tracking was introduced.
They remain as a legacy baseline and must not be replayed. Migration
`20260719000700` is the first CLI-managed change.

If migrations `007` through `011` were already applied manually, link the exact
project and mark each matching version as applied before the next `db push`:

```sh
supabase link --project-ref PROJECT_REF
supabase migration repair --status applied 20260719000700
supabase migration repair --status applied 20260719000800
supabase migration repair --status applied 20260719000900
supabase migration repair --status applied 20260719001000
supabase migration repair --status applied 20260719001100
supabase migration list
```

If they have not been applied, do not run `migration repair`; use `supabase db
push` so the CLI executes them in order. Never store the project reference,
database password, access token, or service-role key in the repository.
