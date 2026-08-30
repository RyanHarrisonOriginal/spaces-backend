import { randomUUID } from 'node:crypto';

import type { CollectionDiscoveryProfile } from './collection-discovery-profile';
import type { PersistedCollectionDiscoveryProfile } from './collection-discovery-profile.repository';

export class CollectionDiscoveryProfileMapper {
  toNewActiveVersion(input: {
    current: PersistedCollectionDiscoveryProfile | null;
    collectionId: string;
    profile: CollectionDiscoveryProfile;
    provider: string;
    model: string;
    promptVersion: string;
    now?: Date;
    id?: string;
  }): PersistedCollectionDiscoveryProfile {
    const now = input.now ?? new Date();
    return {
      id: input.id ?? randomUUID(),
      collectionId: input.collectionId,
      version: (input.current?.version ?? 0) + 1,
      profile: input.profile,
      status: 'active',
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      createdAt: now,
      supersededAt: null,
    };
  }
}
