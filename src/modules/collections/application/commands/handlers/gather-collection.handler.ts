import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { GatherCollectionCommand } from '../gather-collection.command';

const VIDEO_META = ['4:12', '11:38', '18:05', '7:44', '24:19', '3:57'];
const READ_META = ['4 min read', '7 min read', '12 min read', '2 min read'];

function deriveQueries(name: string, description: string): string[] {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const unique = Array.from(new Set(words)).slice(0, 3);
  return [
    `${name} tutorial`,
    `best ${name.toLowerCase()} ${unique[0] ?? 'guide'}`,
    `${unique[1] ?? name.toLowerCase()} ${unique[2] ?? 'explained'}`,
  ];
}

@CommandHandler(GatherCollectionCommand)
export class GatherCollectionHandler
  implements ICommandHandler<GatherCollectionCommand>
{
  constructor(
    private readonly access: CollectionAccessService,
    @Inject(GATHER_QUERY_REPOSITORY)
    private readonly gatherQueries: GatherQueryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: GatherCollectionCommand) {
    const collection = await this.access.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    const sources = await this.prisma.source.findMany({
      where: { isActive: true },
      include: { contentTypes: true },
    });

    if (!sources.length) {
      throw new ValidationException(
        'No active sources available for gathering',
      );
    }

    const types = Array.from(
      new Set(sources.flatMap((s) => s.contentTypes.map((u) => u.contentType))),
    );

    const queries = deriveQueries(collection.name, collection.description);
    await this.gatherQueries.replaceForCollection(
      collection.id,
      queries.map((query) =>
        GatherQuery.create({
          id: randomUUID(),
          collectionId: collection.id,
          query,
        }),
      ),
    );

    const seed = collection.name;
    const slug = seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 32);

    const items: Array<{
      id: string;
      collectionId: string;
      sourceId: string;
      type: 'video' | 'article' | 'image';
      title: string;
      thumbnail: string;
      url: string | null;
      meta: string | null;
      sortOrder: number;
    }> = [];

    let sortOrder = 0;
    for (const type of types) {
      const source = sources.find((s) =>
        s.contentTypes.some((u) => u.contentType === type),
      );
      if (!source) continue;

      const count = type === 'image' ? 6 : 4;
      for (let i = 0; i < count; i++) {
        const key = `${slug}-${type}-${i}`;
        if (type === 'video') {
          items.push({
            id: randomUUID(),
            collectionId: collection.id,
            sourceId: source.id,
            type,
            title: `${seed} — session ${i + 1}`,
            thumbnail: `https://picsum.photos/seed/${key}/640/360`,
            url: 'https://youtube.com',
            meta: VIDEO_META[(i + slug.length) % VIDEO_META.length],
            sortOrder: sortOrder++,
          });
        } else if (type === 'article') {
          items.push({
            id: randomUUID(),
            collectionId: collection.id,
            sourceId: source.id,
            type,
            title: `On ${seed}: notes & references ${i + 1}`,
            thumbnail: `https://picsum.photos/seed/${key}/640/360`,
            url: 'https://example.com',
            meta: READ_META[(i + slug.length) % READ_META.length],
            sortOrder: sortOrder++,
          });
        } else {
          items.push({
            id: randomUUID(),
            collectionId: collection.id,
            sourceId: source.id,
            type,
            title: `${seed} ${i + 1}`,
            thumbnail: `https://picsum.photos/seed/${key}/600/600`,
            url: `https://picsum.photos/seed/${key}/1600/1600`,
            meta: '1:1',
            sortOrder: sortOrder++,
          });
        }
      }
    }

    if (!items.length) {
      throw new ValidationException(
        'No active sources unlock any content types',
      );
    }

    await this.prisma.$transaction([
      this.prisma.contentItem.deleteMany({
        where: { collectionId: collection.id },
      }),
      this.prisma.contentItem.createMany({ data: items }),
    ]);

    const content = await this.prisma.contentItem.findMany({
      where: { collectionId: collection.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      ...collection.toJSON(),
      content,
      queries,
    };
  }
}
