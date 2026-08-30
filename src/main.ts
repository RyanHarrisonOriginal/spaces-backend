import 'reflect-metadata';
import { config } from 'dotenv';

import { disconnectPrisma } from '../packages/db/src';
import { closeJobQueue } from '../packages/queue/src';
import { createApp } from './http/create-app';

config();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const app = createApp();
const server = app.listen(port, host, () => {
  console.log(`Spaces API listening on http://${host}:${port}/api`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`API shutting down (${signal})`);
  server.close();
  await closeJobQueue();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
