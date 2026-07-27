import { Injectable } from '@nestjs/common';
import { SourceSubscription as PrismaSub } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  SourceSubscription,
  SubscriptionStatus,
} from '../domain/source-subscription.entity';
import { SourceSubscriptionRepository } from '../domain/source-subscription.repository';

@Injectable()
export class PrismaSourceSubscriptionRepository extends SourceSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<SourceSubscription | null> {
    const row = await this.prisma.sourceSubscription.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<SourceSubscription[]> {
    const rows = await this.prisma.sourceSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByUserAndSource(
    userId: string,
    sourceId: string,
  ): Promise<SourceSubscription | null> {
    const row = await this.prisma.sourceSubscription.findUnique({
      where: { userId_sourceId: { userId, sourceId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveSourceIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.sourceSubscription.findMany({
      where: { userId, status: 'active' },
      select: { sourceId: true },
    });
    return rows.map((r) => r.sourceId);
  }

  async save(entity: SourceSubscription): Promise<SourceSubscription> {
    const row = await this.prisma.sourceSubscription.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        userId: entity.userId,
        sourceId: entity.sourceId,
        status: entity.status,
        externalRef: entity.externalRef,
        startedAt: entity.startedAt,
        canceledAt: entity.canceledAt,
        currentPeriodEnd: entity.currentPeriodEnd,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        status: entity.status,
        externalRef: entity.externalRef,
        canceledAt: entity.canceledAt,
        currentPeriodEnd: entity.currentPeriodEnd,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sourceSubscription.delete({ where: { id } });
  }

  private toDomain(row: PrismaSub): SourceSubscription {
    return SourceSubscription.reconstitute({
      id: row.id,
      userId: row.userId,
      sourceId: row.sourceId,
      status: row.status as SubscriptionStatus,
      externalRef: row.externalRef,
      startedAt: row.startedAt,
      canceledAt: row.canceledAt,
      currentPeriodEnd: row.currentPeriodEnd,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
