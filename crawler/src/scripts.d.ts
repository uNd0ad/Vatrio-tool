declare module "../../scripts/check-connection-pooling.mjs" {
  export interface PoolingConfig {
    port: number;
    isPooledPort: boolean;
    recommendedMaxConnections: number;
    status: 'OPTIMAL' | 'DIRECT';
  }
  export function evaluatePoolingConfig(env?: Record<string, string | undefined>): PoolingConfig;
}

declare module "../../scripts/supabase-backup.mjs" {
  export function runSupabaseBackup(options?: { type?: string; dryRun?: boolean; env?: Record<string, string | undefined> }): Promise<{ success: boolean; snapshotName: string }>;
}

declare module "../../scripts/check-referential-integrity.mjs" {
  export interface ReferentialIntegrityIssue {
    table: string;
    foreignKey: string;
    orphanedId: string;
  }
  export function checkReferentialIntegrity(data?: { listings?: any[]; photos?: any[]; notes?: any[] }): ReferentialIntegrityIssue[];
}

declare module "../../scripts/seed-db.mjs" {
  export function generateSeedListings(count?: number): any[];
}

declare module "../../scripts/staging-env.mjs" {
  export interface SupabaseConfig {
    url: string;
    key: string;
    environment: 'production' | 'staging' | 'development';
  }
  export function getSupabaseConfig(env?: Record<string, string | undefined>): SupabaseConfig;
}
