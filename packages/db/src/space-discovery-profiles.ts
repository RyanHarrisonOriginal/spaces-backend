import { Prisma, PrismaClient } from '@prisma/client';

import { SpaceDiscoveryProfile } from '../../types/src';
import { DbClient } from './jobs';

export type DiscoverySpace = {
  id: string;
  name: string;
  description: string;
};

export async function findSpaceForDiscovery(
  db: DbClient,
  spaceId: string,
): Promise<DiscoverySpace | null> {
  return db.space.findUnique({
    where: { id: spaceId },
    select: { id: true, name: true, description: true },
  });
}

export async function persistSpaceDiscoveryProfile(
  db: PrismaClient,
  input: {
    spaceId: string;
    jobId: string;
    profile: SpaceDiscoveryProfile;
  },
): Promise<{ id: string; version: number; created: boolean }> {
  return db.$transaction(async (tx) => {
    const existing = await tx.spaceDiscoveryProfile.findUnique({
      where: { jobId: input.jobId },
      select: { id: true, version: true },
    });
    if (existing) {
      return { id: existing.id, version: existing.version, created: false };
    }

    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM spaces WHERE id = ${input.spaceId}::uuid FOR UPDATE
    `;
    if (!locked[0]) {
      throw new Error(`Space '${input.spaceId}' not found`);
    }

    const latest = await tx.spaceDiscoveryProfile.findFirst({
      where: { spaceId: input.spaceId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const now = new Date();

    await tx.spaceDiscoveryProfile.updateMany({
      where: { spaceId: input.spaceId, status: 'active' },
      data: { status: 'superseded', supersededAt: now },
    });

    try {
      const created = await tx.spaceDiscoveryProfile.create({
        data: {
          spaceId: input.spaceId,
          version,
          profile: input.profile as Prisma.InputJsonValue,
          status: 'active',
          jobId: input.jobId,
        },
        select: { id: true, version: true },
      });

      return { id: created.id, version: created.version, created: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await tx.spaceDiscoveryProfile.findUnique({
          where: { jobId: input.jobId },
          select: { id: true, version: true },
        });
        if (raced) {
          return { id: raced.id, version: raced.version, created: false };
        }
      }
      throw error;
    }
  });
}
