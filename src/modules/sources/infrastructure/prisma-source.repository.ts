import { Injectable } from '@nestjs/common';
import { Source as PrismaSource, SourceUnlock } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ContentType, Source } from '../domain/source.entity';
import { SourceRepository } from '../domain/source.repository';

type SourceRow = PrismaSource & { unlocks: SourceUnlock[] };

@Injectable()
export class PrismaSourceRepository extends SourceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Source | null> {
    const row = await this.prisma.source.findUnique({
      where: { id },
      include: { unlocks: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAllActive(): Promise<Source[]> {
    const rows = await this.prisma.source.findMany({
      where: { isActive: true },
      include: { unlocks: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: Source): Promise<Source> {
    const row = await this.prisma.source.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        provider: entity.provider,
        description: entity.description,
        priceCents: entity.priceCents,
        currency: entity.currency,
        billing: entity.billing,
        accent: entity.accent,
        isActive: entity.isActive,
        updatedAt: entity.updatedAt,
      },
      include: { unlocks: true },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.source.delete({ where: { id } });
  }

  private toDomain(row: SourceRow): Source {
    return Source.reconstitute({
      id: row.id,
      name: row.name,
      provider: row.provider,
      description: row.description,
      priceCents: row.priceCents,
      currency: row.currency,
      billing: row.billing,
      accent: row.accent,
      isActive: row.isActive,
      unlocks: row.unlocks.map(
        (u) => u.contentType as ContentType,
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
