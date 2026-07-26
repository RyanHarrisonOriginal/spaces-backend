import { ContentType, ThingStatus } from '../../domain/thing.entity';

export class UpdateThingCommand {
  constructor(
    public readonly userId: string,
    public readonly thingId: string,
    public readonly patch: {
      name?: string;
      description?: string;
      contentTypes?: ContentType[];
      status?: ThingStatus;
      sortOrder?: number;
    },
  ) {}
}
