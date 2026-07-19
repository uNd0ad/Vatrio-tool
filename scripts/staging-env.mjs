export function getSupabaseConfig(env = process.env) {
  const isStaging = env.APP_ENV === 'staging' || env.VITE_APP_ENV === 'staging';
  const url = isStaging
    ? env.STAGING_SUPABASE_URL || 'https://staging.supabase.co'
    : env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://vatrio.supabase.co';
  const anonKey = isStaging
    ? env.STAGING_SUPABASE_ANON_KEY || 'staging-anon-key'
    : env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || 'prod-anon-key';

  return {
    environment: isStaging ? 'staging' : 'production',
    url,
    anonKey,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const config = getSupabaseConfig();
  console.log(`[Environment] Active profile: ${config.environment}`);
  console.log(`[Environment] URL: ${config.url}`);
}
