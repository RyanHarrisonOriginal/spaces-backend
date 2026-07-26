import { Injectable } from '@nestjs/common';
import { Space as PrismaSpace, SpaceView as PrismaSpaceView } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Space, SpaceView } from '../domain/space.entity';
import { SpaceRepository } from '../domain/space.repository';

@Injectable()
export class PrismaSpaceRepository extends SpaceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Space | null> {
    const row = await this.prisma.space.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Space[]> {
    const rows = await this.prisma.space.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: Space): Promise<Space> {
    const row = await this.prisma.space.upsert({
      where: { id: entity.id },
      create: {
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
      },
      update: {
        name: entity.name,
        description: entity.description,
        accent: entity.accent,
        headerFont: entity.headerFont,
        bgColor: entity.bgColor,
        textColor: entity.textColor,
        view: entity.view as PrismaSpaceView,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.space.delete({ where: { id } });
  }

  private toDomain(row: PrismaSpace): Space {
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
}
