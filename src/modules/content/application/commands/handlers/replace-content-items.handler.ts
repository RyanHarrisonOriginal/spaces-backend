import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { CollectionAccessService } from '../../../../collections/application/services/collection-access.service';
import { ContentItem } from '../../../domain/content-item.entity';
import {
  CONTENT_ITEM_REPOSITORY,
  ContentItemRepository,
} from '../../../domain/content-item.repository';
import { ReplaceContentItemsCommand } from '../replace-content-items.command';

@CommandHandler(ReplaceContentItemsCommand)
export class ReplaceContentItemsHandler
  implements ICommandHandler<ReplaceContentItemsCommand>
{
  constructor(
    @Inject(CONTENT_ITEM_REPOSITORY)
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
      return this.contentItems.replaceForCollection(
        command.collectionId,
        items,
      );
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid content items',
      );
    }
  }
}
