# Supabase CLI migration workflow

Timestamped files in `supabase/migrations/` are the source of truth for new
database changes. Create future migrations with:

```sh
supabase migration new descriptive_name
```

Validate locally with `supabase start` and `supabase db reset`, then deploy to a
linked staging project with `supabase db push`. Review the generated diff before
deploying production.

## Existing project adoption

Migrations `001` through `006` and the older named SQL files were applied
manually before CLI tracking was introduced. They remain as a legacy baseline
and must not be replayed. Migration `20260719000700` is the first CLI-managed
change.

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
