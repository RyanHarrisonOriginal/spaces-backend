import {
  Source as PrismaSource,
  SourceContentType,
} from '@prisma/client';

import { ContentType, Source } from '../domain/source.entity';

type SourceRow = PrismaSource & { contentTypes: SourceContentType[] };

export class PrismaSourceMapper {
  toDomain(row: SourceRow): Source {
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
      unlocks: row.contentTypes.map((u) => u.contentType as ContentType),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  toUpdateData(entity: Source) {
    return {
      name: entity.name,
      provider: entity.provider,
      description: entity.description,
      priceCents: entity.priceCents,
      currency: entity.currency,
      billing: entity.billing,
      accent: entity.accent,
      isActive: entity.isActive,
      updatedAt: entity.updatedAt,
    };
  }
}
