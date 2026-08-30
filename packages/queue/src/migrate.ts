import { config } from 'dotenv';
import { Pool } from 'pg';
import { runMigrations } from 'bullmq';

import { BULLMQ_SCHEMA, getDirectDatabaseUrl } from './connection';

export async function migrateBullmqSchema(): Promise<number> {
  const pool = new Pool({
    connectionString: getDirectDatabaseUrl(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const client = await pool.connect();
  try {
    return await runMigrations(client, BULLMQ_SCHEMA);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  config();
  void migrateBullmqSchema()
    .then((version) => {
      console.log(
        `BullMQ schema "${BULLMQ_SCHEMA}" is at version ${version}`,
      );
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
