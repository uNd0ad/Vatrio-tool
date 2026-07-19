export interface PoolingConfig {
  port: number;
  isPooledPort: boolean;
  recommendedMaxConnections: number;
  status: 'OPTIMAL' | 'DIRECT';
}

export function evaluatePoolingConfig(env?: Record<string, string | undefined>): PoolingConfig;
