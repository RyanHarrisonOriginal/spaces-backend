import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { GetSpaceTreeQuery } from '../get-space-tree.query';
import { SpaceTreeReadModel } from '../space-tree.read-model';

@QueryHandler(GetSpaceTreeQuery)
export class GetSpaceTreeHandler
  implements IQueryHandler<GetSpaceTreeQuery, SpaceTreeReadModel>
{
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetSpaceTreeQuery): Promise<SpaceTreeReadModel> {
    const space = await this.spaces.findById(query.spaceId);
    if (!space || space.userId !== query.userId) {
      throw new NotFoundException('Space', query.spaceId);
    }

    const row = await this.prisma.space.findUnique({
      where: { id: query.spaceId },
      include: {
        collections: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            things: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: { contentTypes: true },
            },
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Space', query.spaceId);
    }

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      accent: row.accent,
      headerFont: row.headerFont,
      bgColor: row.bgColor,
      textColor: row.textColor,
      view: row.view,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      collections: row.collections.map((collection) => ({
        id: collection.id,
        spaceId: collection.spaceId,
        name: collection.name,
        description: collection.description,
        sortOrder: collection.sortOrder,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        things: collection.things.map((thing) => ({
          id: thing.id,
          collectionId: thing.collectionId,
          name: thing.name,
          description: thing.description,
          status: thing.status,
          sortOrder: thing.sortOrder,
          contentTypes: thing.contentTypes.map((ct) => ct.contentType),
          createdAt: thing.createdAt,
          updatedAt: thing.updatedAt,
        })),
      })),
    };
  }
}
