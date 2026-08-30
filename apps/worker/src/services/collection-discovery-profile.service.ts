import { PrismaClient } from '@prisma/client';

import {
  CollectionDiscoveryProfileService,
  CollectionNotFoundError,
  OpenAiAdapter,
  PrismaCollectionDiscoveryProfileRepository,
} from '../../../../packages/discovery/src';
import type { PersistedCollectionDiscoveryProfile } from '../../../../packages/discovery/src';

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

  return profileService.generateAndPersist({
    collectionId: collection.id,
    collectionDescription: collection.description,
    spaceDescription: collection.space.description,
  });
}
