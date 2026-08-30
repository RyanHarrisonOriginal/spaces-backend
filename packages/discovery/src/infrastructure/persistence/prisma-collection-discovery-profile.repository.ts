import { Prisma, PrismaClient } from '@prisma/client';

import { CollectionNotFoundError } from '../../application/errors/llm-generation.error';
import {
  CollectionDiscoveryProfileRepository,
  PersistedCollectionDiscoveryProfile,
} from '../../domain/collection-discovery-profile.repository';
import { PrismaCollectionDiscoveryProfileMapper } from './prisma-collection-discovery-profile.mapper';

type TransactionClient = Prisma.TransactionClient;

export class PrismaCollectionDiscoveryProfileRepository extends CollectionDiscoveryProfileRepository {
  private readonly profileMapper = new PrismaCollectionDiscoveryProfileMapper();

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(
    collectionId: string,
  ): Promise<PersistedCollectionDiscoveryProfile | null> {
    const row = await this.prisma.collectionDiscoveryProfile.findFirst({
      where: { collectionId },
      orderBy: { version: 'desc' },
    });
    return row ? this.profileMapper.toDomain(row) : null;
  }

  async save(
    record: PersistedCollectionDiscoveryProfile,
  ): Promise<PersistedCollectionDiscoveryProfile> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCollection(tx, record.collectionId);
      await this.supersedeActive(tx, record.collectionId, record.createdAt);
      return this.insert(tx, record);
    });
  }

  private async lockCollection(
    tx: TransactionClient,
    collectionId: string,
  ): Promise<void> {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM collections WHERE id = ${collectionId}::uuid FOR UPDATE
    `;
    if (!locked[0]) {
      throw new CollectionNotFoundError(collectionId);
    }
  }

  private async supersedeActive(
    tx: TransactionClient,
    collectionId: string,
    supersededAt: Date,
  ): Promise<void> {
    await tx.collectionDiscoveryProfile.updateMany({
      where: { collectionId, status: 'active' },
      data: { status: 'superseded', supersededAt },
    });
  }

  private async insert(
    tx: TransactionClient,
    record: PersistedCollectionDiscoveryProfile,
  ): Promise<PersistedCollectionDiscoveryProfile> {
    const created = await tx.collectionDiscoveryProfile.create({
      data: this.profileMapper.toCreateData(record),
    });
    return this.profileMapper.toDomain(created);
  }
}
