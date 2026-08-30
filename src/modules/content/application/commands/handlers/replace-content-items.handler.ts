import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { CollectionAccessService } from '../../../../collections/application/services/collection-access.service';
import { ContentItem } from '../../../domain/content-item.entity';
import {
  ContentItemRepository,
  ContentItemSave,
} from '../../../domain/content-item.repository';
import { ReplaceContentItemsCommand } from '../replace-content-items.command';

export class ReplaceContentItemsHandler {
  constructor(
    private readonly contentItems: ContentItemRepository,
    private readonly access: CollectionAccessService,
  ) {}

  async execute(command: ReplaceContentItemsCommand): Promise<ContentItem[]> {
    await this.access.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    try {
      const items = command.items.map((item, index) =>
        ContentItem.create({
          id: randomUUID(),
          collectionId: command.collectionId,
          sourceId: item.sourceId,
          type: item.type,
          title: item.title,
          thumbnail: item.thumbnail,
          url: item.url,
          meta: item.meta,
          sortOrder: index,
        }),
      );
      return this.contentItems.save(
        { collectionId: command.collectionId, items },
        ContentItemSave.Replace,
      );
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid content items',
      );
    }
  }
}
