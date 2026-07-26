import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  THING_REPOSITORY,
  ThingRepository,
} from '../../../domain/thing.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { DeleteThingCommand } from '../delete-thing.command';

@CommandHandler(DeleteThingCommand)
export class DeleteThingHandler implements ICommandHandler<DeleteThingCommand> {
  constructor(
    @Inject(THING_REPOSITORY)
    private readonly things: ThingRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(command: DeleteThingCommand): Promise<void> {
    await this.access.requireOwnedThing(command.userId, command.thingId);
    await this.things.delete(command.thingId);
  }
}
