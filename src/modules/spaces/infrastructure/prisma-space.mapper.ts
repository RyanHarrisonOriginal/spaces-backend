import { Space as PrismaSpace, SpaceView as PrismaSpaceView } from '@prisma/client';

import { Space, SpaceView } from '../domain/space.entity';

export class PrismaSpaceMapper {
  toDomain(row: PrismaSpace): Space {
    return Space.reconstitute({
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      accent: row.accent,
      headerFont: row.headerFont,
      bgColor: row.bgColor,
      textColor: row.textColor,
      view: row.view as SpaceView,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  toCreateData(entity: Space) {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      accent: entity.accent,
      headerFont: entity.headerFont,
      bgColor: entity.bgColor,
      textColor: entity.textColor,
      view: entity.view as PrismaSpaceView,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toUpdateData(entity: Space) {
    return {
      name: entity.name,
      description: entity.description,
      accent: entity.accent,
      headerFont: entity.headerFont,
      bgColor: entity.bgColor,
      textColor: entity.textColor,
      view: entity.view as PrismaSpaceView,
      updatedAt: entity.updatedAt,
    };
  }
}
