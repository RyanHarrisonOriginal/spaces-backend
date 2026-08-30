import type { PostgresPoolConfig } from 'bullmq';

export const BULLMQ_SCHEMA = 'bullmq';

export function getDirectDatabaseUrl(): string {
  const connectionString = process.env.NEON_DIRECT_DATABASE_URL;
  if (!connectionString) {
    throw new Error('NEON_DIRECT_DATABASE_URL is required');
  }
  return connectionString;
}

/** Direct Neon session connection. Not the PgBouncer pooled DATABASE_URL. */
export function getBullmqConnection(): PostgresPoolConfig {
  return {
    connectionString: getDirectDatabaseUrl(),
    schema: BULLMQ_SCHEMA,
    ssl: {
      rejectUnauthorized: false,
    },
  };
}
