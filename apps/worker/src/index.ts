import { config } from 'dotenv';
import { hostname } from 'os';
import { ZodError } from 'zod';

import {
  claimNextJob,
  disconnectPrisma,
  getPrisma,
  markJobCompleted,
  markJobFailed,
  releaseJobForRetry,
} from '../../../packages/db/src';
import { createJobRouter } from './jobs/job-router';
import { UnretryableJobError } from './jobs/job-types';
import { logger } from './logger';

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 2000);
const WORKER_ID = `worker-${hostname()}-${process.pid}`;

function retryDelayMs(attempts: number): number {
  return Math.min(60_000, 1000 * 2 ** Math.max(0, attempts - 1));
}

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isUnretryable(error: unknown): boolean {
  return error instanceof UnretryableJobError;
}

async function main(): Promise<void> {
  config();
  const db = getPrisma();
  const routeJob = createJobRouter(db);
  let running = true;

  const shutdown = async (signal: string) => {
    if (!running) return;
    running = false;
    logger.info('worker shutting down', { signal, workerId: WORKER_ID });
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  logger.info('worker started', {
    workerId: WORKER_ID,
    pollIntervalMs: POLL_INTERVAL_MS,
    aiProvider: process.env.OPENAI_API_KEY ? 'openai' : 'heuristic',
  });

  while (running) {
    try {
      const job = await claimNextJob(db, WORKER_ID);
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      logger.info('job claimed', {
        jobId: job.id,
        type: job.type,
        attempts: job.attempts,
        workerId: WORKER_ID,
      });

      try {
        await routeJob(job);
        await markJobCompleted(db, job.id);
        logger.info('job completed', { jobId: job.id, type: job.type });
      } catch (error) {
        const message = errorMessage(error);
        const giveUp =
          isUnretryable(error) || job.attempts >= job.maxAttempts;

        if (giveUp) {
          await markJobFailed(db, job.id, message);
          logger.error('job failed', {
            jobId: job.id,
            type: job.type,
            attempts: job.attempts,
            error: message,
          });
        } else {
          const delayMs = retryDelayMs(job.attempts);
          await releaseJobForRetry(db, job.id, message, delayMs);
          logger.warn('job released for retry', {
            jobId: job.id,
            type: job.type,
            attempts: job.attempts,
            delayMs,
            error: message,
          });
        }
      }
    } catch (error) {
      logger.error('worker loop error', { error: errorMessage(error) });
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main();
