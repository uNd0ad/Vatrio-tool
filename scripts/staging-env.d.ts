export interface SupabaseConfig {
  url: string;
  key: string;
  environment: 'production' | 'staging' | 'development';
}

export function getSupabaseConfig(env?: Record<string, string | undefined>): SupabaseConfig;
