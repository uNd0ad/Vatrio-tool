export function runSupabaseBackup(options?: { type?: string; dryRun?: boolean; env?: Record<string, string | undefined> }): Promise<{ success: boolean; snapshotName: string }>;
