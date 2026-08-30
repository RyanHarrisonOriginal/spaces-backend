import { CollectionDiscoveryProfile } from './collection-discovery-profile';

export type CollectionDiscoveryProfileStatus = 'active' | 'superseded';

export type PersistedCollectionDiscoveryProfile = {
  id: string;
  collectionId: string;
  version: number;
  profile: CollectionDiscoveryProfile;
  status: CollectionDiscoveryProfileStatus;
  provider: string;
  model: string;
  promptVersion: string;
  createdAt: Date;
  supersededAt: Date | null;
};

export abstract class CollectionDiscoveryProfileRepository {
  abstract get(
    collectionId: string,
  ): Promise<PersistedCollectionDiscoveryProfile | null>;

  abstract save(
    record: PersistedCollectionDiscoveryProfile,
  ): Promise<PersistedCollectionDiscoveryProfile>;
}
