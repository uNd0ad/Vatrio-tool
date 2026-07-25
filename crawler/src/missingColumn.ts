/**
 * Recunoaște eroarea „coloana nu există", ca scrierile și citirile să poată
 * degrada elegant când o migrație nu e încă aplicată în baza țintă.
 *
 * Postgres întoarce `42703` la interogări, iar stratul PostgREST întoarce
 * `PGRST204` la scrieri, cu numele coloanei în mesaj.
 */
export function isMissingColumnError(
  error: { code?: string; message?: string } | null | undefined,
  /** Verifică suplimentar că lipsește exact coloana asta. */
  column?: string
): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  const isMissingColumn =
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .* does not exist|could not find the .* column/i.test(message);
  if (!isMissingColumn) return false;
  return column ? message.includes(column) : true;
}
