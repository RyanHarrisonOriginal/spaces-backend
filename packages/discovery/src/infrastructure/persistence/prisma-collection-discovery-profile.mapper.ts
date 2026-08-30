import { Prisma } from '@prisma/client';

import { collectionDiscoveryProfileSchema } from '../../domain/collection-discovery-profile';
import type { PersistedCollectionDiscoveryProfile } from '../../domain/collection-discovery-profile.repository';

type PrismaCollectionDiscoveryProfileRow = {
  id: string;
  collectionId: string;
  version: number;
  profile: Prisma.JsonValue;
  status: 'active' | 'superseded';
  provider: string;
  model: string;
  promptVersion: string;
  createdAt: Date;
  supersededAt: Date | null;
};

export class PrismaCollectionDiscoveryProfileMapper {
  toDomain(
    row: PrismaCollectionDiscoveryProfileRow,
  ): PersistedCollectionDiscoveryProfile {
    return {
      id: row.id,
      collectionId: row.collectionId,
      version: row.version,
      profile: collectionDiscoveryProfileSchema.parse(row.profile),
      status: row.status,
      provider: row.provider,
      model: row.model,
      promptVersion: row.promptVersion,
      createdAt: row.createdAt,
      supersededAt: row.supersededAt,
    };
  }

  toCreateData(
    record: PersistedCollectionDiscoveryProfile,
  ): Prisma.CollectionDiscoveryProfileUncheckedCreateInput {
    return {
      id: record.id,
      collectionId: record.collectionId,
      version: record.version,
      profile: record.profile as Prisma.InputJsonValue,
      status: record.status,
      provider: record.provider,
      model: record.model,
      promptVersion: record.promptVersion,
      createdAt: record.createdAt,
      supersededAt: record.supersededAt,
    };
  }
}
