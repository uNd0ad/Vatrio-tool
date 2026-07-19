export function evaluatePoolingConfig(env = process.env) {
  const dbPort = env.DB_PORT ? Number(env.DB_PORT) : 6543;
  const isPooledPort = dbPort === 6543 || dbPort === 5432;
  const recommendedMaxConnections = isPooledPort ? 25 : 10;

  return {
    port: dbPort,
    isPooledPort,
    recommendedMaxConnections,
    status: isPooledPort ? 'OPTIMAL' : 'DIRECT',
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('[Pooling Review] Auditing database connection pool settings...');
  const poolInfo = evaluatePoolingConfig();
  console.log(`Port: ${poolInfo.port}, Status: ${poolInfo.status}, Recommended Max: ${poolInfo.recommendedMaxConnections}`);
}
