
import { CollectionAccessService } from '../../../../collections/application/services/collection-access.service';
import { ContentItem } from '../../../domain/content-item.entity';
import {
  ContentItemRepository,
} from '../../../domain/content-item.repository';
import { ListContentItemsQuery } from '../list-content-items.query';

export class ListContentItemsHandler {
  constructor(
    private readonly contentItems: ContentItemRepository,
    private readonly access: CollectionAccessService,
  ) {}

  async execute(query: ListContentItemsQuery): Promise<ContentItem[]> {
    await this.access.requireOwnedCollection(query.userId, query.collectionId);
    return this.contentItems.get({ collectionId: query.collectionId });
  }
}
