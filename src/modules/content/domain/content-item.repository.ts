import { Repository } from '../../../shared/domain/repository';
import { ContentItem } from './content-item.entity';

export const CONTENT_ITEM_REPOSITORY = Symbol('CONTENT_ITEM_REPOSITORY');

export abstract class ContentItemRepository extends Repository<ContentItem> {
  abstract findByThingId(thingId: string): Promise<ContentItem[]>;
  abstract replaceForThing(
    thingId: string,
    items: ContentItem[],
  ): Promise<ContentItem[]>;
}
