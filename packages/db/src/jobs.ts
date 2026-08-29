import { Prisma, PrismaClient } from '@prisma/client';

import { EnqueueJobInput, JOB_TYPES, JobType } from '../../types/src';

export type DbClient = PrismaClient | Prisma.TransactionClient;

export type ClaimedJob = {
  id: string;
  type: JobType | string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
};

type ClaimedJobRow = {
  id: string;
  type: string;
  payload_json: unknown;
  attempts: number;
  max_attempts: number;
};

export async function enqueueJob<T extends JobType>(
  db: DbClient,
  input: EnqueueJobInput<T>,
): Promise<{ id: string }> {
  const job = await db.job.create({
    data: {
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return job;
}

export async function enqueueGenerateSpaceDiscoveryProfile(
  db: DbClient,
  spaceId: string,
): Promise<{ id: string }> {
  return enqueueJob(db, {
    type: JOB_TYPES.GENERATE_SPACE_DISCOVERY_PROFILE,
    payload: { spaceId },
  });
}

export async function claimNextJob(
  db: PrismaClient,
  workerId: string,
): Promise<ClaimedJob | null> {
  const rows = await db.$queryRaw<ClaimedJobRow[]>(Prisma.sql`
    UPDATE jobs
    SET
      status = 'processing'::job_status,
      locked_at = NOW(),
      locked_by = ${workerId},
      attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending'::job_status
        AND available_at <= NOW()
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, type, payload_json, attempts, max_attempts
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    type: row.type,
    payload:
      typeof row.payload_json === 'string'
        ? (JSON.parse(row.payload_json) as unknown)
        : row.payload_json,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
  };
}

export async function markJobCompleted(
  db: DbClient,
  jobId: string,
): Promise<void> {
  await db.job.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

export async function markJobFailed(
  db: DbClient,
  jobId: string,
  error: string,
): Promise<void> {
  await db.job.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      lastError: truncateError(error),
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function releaseJobForRetry(
  db: DbClient,
  jobId: string,
  error: string,
  delayMs: number,
): Promise<void> {
  await db.job.update({
    where: { id: jobId },
    data: {
      status: 'pending',
      lastError: truncateError(error),
      availableAt: new Date(Date.now() + delayMs),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

function truncateError(error: string): string {
  return error.slice(0, 2000);
}
