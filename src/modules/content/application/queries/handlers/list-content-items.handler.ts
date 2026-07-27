import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ThingAccessService } from '../../../../things/application/services/thing-access.service';
import { ContentItem } from '../../../domain/content-item.entity';
import {
  CONTENT_ITEM_REPOSITORY,
  ContentItemRepository,
} from '../../../domain/content-item.repository';
import { ListContentItemsQuery } from '../list-content-items.query';

@QueryHandler(ListContentItemsQuery)
export class ListContentItemsHandler
  implements IQueryHandler<ListContentItemsQuery>
{
  constructor(
    @Inject(CONTENT_ITEM_REPOSITORY)
    private readonly contentItems: ContentItemRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(query: ListContentItemsQuery): Promise<ContentItem[]> {
    await this.access.requireOwnedThing(query.userId, query.thingId);
    return this.contentItems.findByThingId(query.thingId);
  }
}
