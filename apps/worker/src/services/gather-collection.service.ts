import { PrismaClient } from '@prisma/client';

import { CollectionNotFoundError } from '../../../../packages/discovery/src';
import { runGenerateCollectionDiscoveryProfile } from './collection-discovery-profile.service';

export async function runGatherCollection(
  db: PrismaClient,
  collectionId: string,
): Promise<void> {
  const collection = await db.collection.findUnique({
    where: { id: collectionId },
    select: { id: true },
  });
  if (!collection) {
    throw new CollectionNotFoundError(collectionId);
  }

  await runGenerateCollectionDiscoveryProfile(db, collectionId);
}
