import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { Thing } from '../../../domain/thing.entity';
import {
  THING_REPOSITORY,
  ThingRepository,
} from '../../../domain/thing.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { UpdateThingCommand } from '../update-thing.command';

@CommandHandler(UpdateThingCommand)
export class UpdateThingHandler implements ICommandHandler<UpdateThingCommand> {
  constructor(
    @Inject(THING_REPOSITORY)
    private readonly things: ThingRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(command: UpdateThingCommand): Promise<Thing> {
    const thing = await this.access.requireOwnedThing(
      command.userId,
      command.thingId,
    );

    try {
      thing.update(command.patch);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid thing update',
      );
    }

    return this.things.save(thing);
  }
}
