export const SCRAPED_DATA_SCHEMA_VERSION = 1 as const;

export function versionScrapedData<T extends object>(value: T): T & { schema_version: number } {
  return { ...value, schema_version: SCRAPED_DATA_SCHEMA_VERSION };
}
