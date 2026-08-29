import { ContentType } from '../../domain/content-item.entity';

export interface ContentItemInput {
  sourceId: string;
  type: ContentType;
  title: string;
  thumbnail?: string;
  url?: string | null;
  meta?: string | null;
}

export class ReplaceContentItemsCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly items: ContentItemInput[],
  ) {}
}
