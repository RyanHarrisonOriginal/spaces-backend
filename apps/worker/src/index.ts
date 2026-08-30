import { config } from 'dotenv';
import { UnrecoverableError, Worker, createPostgresBackend } from 'bullmq';
import { hostname } from 'os';
import { ZodError } from 'zod';

import { disconnectPrisma, getPrisma } from '../../../packages/db/src';
import {
  JOB_QUEUE_NAME,
  getBullmqConnection,
} from '../../../packages/queue/src';
import { createJobRouter } from './jobs/job-router';
import { UnretryableJobError } from './jobs/job-types';
import { logger } from './logger';

const WORKER_ID = `worker-${hostname()}-${process.pid}`;
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 2);

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function main(): Promise<void> {
  config();
  const db = getPrisma();
  const routeJob = createJobRouter(db);

  const worker = new Worker(
    JOB_QUEUE_NAME,
    async (job) => {
      logger.info('job started', {
        jobId: job.id,
        type: job.name,
        attempts: job.attemptsMade + 1,
        workerId: WORKER_ID,
      });

      try {
        await routeJob({
          id: String(job.id ?? ''),
          type: job.name,
          payload: job.data,
        });
      } catch (error) {
        if (error instanceof UnretryableJobError) {
          throw new UnrecoverableError(error.message);
        }
        throw error;
      }
    },
    {
      connection: getBullmqConnection(),
      concurrency: CONCURRENCY,
    },
    createPostgresBackend,
  );

  worker.on('completed', (job) => {
    logger.info('job completed', { jobId: job.id, type: job.name });
  });

  worker.on('failed', (job, error) => {
    logger.error('job failed', {
      jobId: job?.id,
      type: job?.name,
      attempts: job?.attemptsMade,
      error: errorMessage(error),
    });
  });

  worker.on('error', (error) => {
    logger.error('worker error', { error: errorMessage(error) });
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('worker shutting down', { signal, workerId: WORKER_ID });
    await worker.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  logger.info('worker started', {
    workerId: WORKER_ID,
    queue: JOB_QUEUE_NAME,
    concurrency: CONCURRENCY,
  });
}

void main();
