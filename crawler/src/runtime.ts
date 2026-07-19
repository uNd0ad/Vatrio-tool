export function isDryRun(args: readonly string[] = process.argv.slice(2), envValue = process.env.CRAWLER_DRY_RUN): boolean {
  return args.includes("--dry-run") || envValue === "1" || envValue?.toLowerCase() === "true";
}
