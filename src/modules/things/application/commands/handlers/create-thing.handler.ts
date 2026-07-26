import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { Thing } from '../../../domain/thing.entity';
import {
  THING_REPOSITORY,
  ThingRepository,
} from '../../../domain/thing.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { CreateThingCommand } from '../create-thing.command';

@CommandHandler(CreateThingCommand)
export class CreateThingHandler implements ICommandHandler<CreateThingCommand> {
  constructor(
    @Inject(THING_REPOSITORY)
    private readonly things: ThingRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(command: CreateThingCommand): Promise<Thing> {
    await this.access.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    try {
      const thing = Thing.create({
        id: randomUUID(),
        collectionId: command.collectionId,
        name: command.name,
        description: command.description,
        contentTypes: command.contentTypes,
        sortOrder: command.sortOrder,
      });
      return this.things.save(thing);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid thing',
      );
    }
  }
}
