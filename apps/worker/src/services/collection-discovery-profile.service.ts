import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

import {
  CollectionDiscoveryProfileService,
  CollectionNotFoundError,
  OpenAiAdapter,
  PrismaCollectionDiscoveryProfileRepository,
} from '../../../../packages/discovery/src';
import type { PersistedCollectionDiscoveryProfile } from '../../../../packages/discovery/src';
import {
  GatherQuery,
  GatherQuerySaveStrategy,
  PrismaGatherQueryRepository,
} from '../../../../packages/persistence/src';

export async function runGenerateCollectionDiscoveryProfile(
  db: PrismaClient,
  collectionId: string,
): Promise<PersistedCollectionDiscoveryProfile> {
  const collection = await db.collection.findUnique({
    where: { id: collectionId },
    include: { space: { select: { description: true } } },
  });
  if (!collection) {
    throw new CollectionNotFoundError(collectionId);
  }

  const profileService = new CollectionDiscoveryProfileService(
    OpenAiAdapter.fromEnv(),
    new PrismaCollectionDiscoveryProfileRepository(db),
  );

  const persisted = await profileService.generateAndPersist({
    collectionId: collection.id,
    collectionDescription: collection.description,
    spaceDescription: collection.space.description,
  });

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

  return persisted;
}
