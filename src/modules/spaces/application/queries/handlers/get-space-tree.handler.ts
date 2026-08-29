import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { GetSpaceTreeQuery } from '../get-space-tree.query';
import { SpaceTreeReadModel } from '../space-tree.read-model';

const spaceTreeInclude = {
  collections: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      gatherQueries: {
        orderBy: { createdAt: 'asc' as const },
      },
      contentItems: {
        orderBy: [
          { sortOrder: 'asc' as const },
          { createdAt: 'asc' as const },
        ],
      },
    },
  },
} satisfies Prisma.SpaceInclude;

type SpaceTreeRow = Prisma.SpaceGetPayload<{ include: typeof spaceTreeInclude }>;

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

    const row: SpaceTreeRow | null = await this.prisma.space.findUnique({
      where: { id: query.spaceId },
      include: spaceTreeInclude,
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
        queries: collection.gatherQueries.map((q) => q.query),
        content: collection.contentItems.map((item) => ({
          id: item.id,
          collectionId: item.collectionId,
          sourceId: item.sourceId,
          type: item.type,
          title: item.title,
          thumbnail: item.thumbnail,
          url: item.url,
          meta: item.meta,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt,
        })),
      })),
    };
  }
}
