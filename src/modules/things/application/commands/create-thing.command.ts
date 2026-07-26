import { ContentType } from '../../domain/thing.entity';

export class CreateThingCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly contentTypes: ContentType[],
    public readonly sortOrder?: number,
  ) {}
}
