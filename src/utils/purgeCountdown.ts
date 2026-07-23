/** Fereastra de retenție pentru coșul de gunoi — sincron cu migrația
 *  20260723000100 (data_retention_policies: listings_soft_deleted = 30). */
export const TRASH_RETENTION_DAYS = 30;

const MS_PER_DAY = 86_400_000;

/**
 * Câte zile mai are un anunț șters până la ștergerea definitivă. Se rotunjește
 * în sus (o ștergere de acum 0,3 zile mai are „30 de zile"), iar valoarea nu
 * coboară sub 0 pentru rândurile care așteaptă doar următoarea rulare a purjării.
 */
export function daysUntilPurge(deletedAt: string, now = new Date()): number {
  const deleted = new Date(deletedAt).getTime();
  if (Number.isNaN(deleted)) return TRASH_RETENTION_DAYS;
  const elapsedDays = (now.getTime() - deleted) / MS_PER_DAY;
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}
