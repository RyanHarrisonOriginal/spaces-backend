import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

import { CollectionNotFoundError } from '../../../../packages/discovery/src';
import {
  GatherQuery,
  GatherQuerySaveStrategy,
  PrismaGatherQueryRepository,
} from '../../../../packages/persistence/src';
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

  const persisted = await runGenerateCollectionDiscoveryProfile(
    db,
    collectionId,
  );

  const gatherQueryRepo = new PrismaGatherQueryRepository(db);
  await gatherQueryRepo.save(
    {
      collectionId: collection.id,
      items: persisted.profile.searchQueries.map((query) =>
        GatherQuery.create({
          id: randomUUID(),
          collectionId: collection.id,
          query,
        }),
      ),
    },
    GatherQuerySaveStrategy.Replace,
  );
}
