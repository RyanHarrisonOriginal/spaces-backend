import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import {
  SOURCE_SUBSCRIPTION_REPOSITORY,
  SourceSubscriptionRepository,
} from '../../../../sources/domain/source-subscription.repository';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import {
  THING_REPOSITORY,
  ThingRepository,
} from '../../../domain/thing.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { GatherThingCommand } from '../gather-thing.command';

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

@CommandHandler(GatherThingCommand)
export class GatherThingHandler implements ICommandHandler<GatherThingCommand> {
  constructor(
    @Inject(THING_REPOSITORY)
    private readonly things: ThingRepository,
    @Inject(GATHER_QUERY_REPOSITORY)
    private readonly gatherQueries: GatherQueryRepository,
    @Inject(SOURCE_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SourceSubscriptionRepository,
    private readonly access: ThingAccessService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: GatherThingCommand) {
    const thing = await this.access.requireOwnedThing(
      command.userId,
      command.thingId,
    );

    const activeSourceIds = await this.subscriptions.findActiveSourceIds(
      command.userId,
    );
    if (!activeSourceIds.length) {
      throw new ValidationException(
        'Subscribe to at least one source before gathering',
      );
    }

    const sources = await this.prisma.source.findMany({
      where: { id: { in: activeSourceIds }, isActive: true },
      include: { unlocks: true },
    });

    thing.update({ status: 'fetching' });
    await this.things.save(thing);

    const queries = deriveQueries(thing.name, thing.description);
    await this.gatherQueries.replaceForThing(
      thing.id,
      queries.map((query) =>
        GatherQuery.create({
          id: randomUUID(),
          thingId: thing.id,
          query,
        }),
      ),
    );

    const seed = thing.name;
    const slug = seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 32);

    const items: Array<{
      id: string;
      thingId: string;
      sourceId: string;
      type: 'video' | 'article' | 'image';
      title: string;
      thumbnail: string;
      url: string | null;
      meta: string | null;
      sortOrder: number;
    }> = [];

    let sortOrder = 0;
    for (const type of thing.contentTypes) {
      const source = sources.find((s) =>
        s.unlocks.some((u) => u.contentType === type),
      );
      if (!source) continue;

      const count = type === 'image' ? 6 : 4;
      for (let i = 0; i < count; i++) {
        const key = `${slug}-${type}-${i}`;
        if (type === 'video') {
          items.push({
            id: randomUUID(),
            thingId: thing.id,
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
            thingId: thing.id,
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
            thingId: thing.id,
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
      thing.update({ status: 'error' });
      await this.things.save(thing);
      throw new ValidationException(
        'No subscribed sources unlock the requested content types',
      );
    }

    await this.prisma.$transaction([
      this.prisma.contentItem.deleteMany({ where: { thingId: thing.id } }),
      this.prisma.contentItem.createMany({ data: items }),
    ]);

    thing.update({ status: 'ready' });
    const saved = await this.things.save(thing);

    const content = await this.prisma.contentItem.findMany({
      where: { thingId: thing.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      ...saved.toJSON(),
      content,
      queries,
    };
  }
}
