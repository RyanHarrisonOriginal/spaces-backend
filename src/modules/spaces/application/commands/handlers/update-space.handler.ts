import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import { Space } from '../../../domain/space.entity';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { UpdateSpaceCommand } from '../update-space.command';

@CommandHandler(UpdateSpaceCommand)
export class UpdateSpaceHandler implements ICommandHandler<UpdateSpaceCommand> {
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: UpdateSpaceCommand): Promise<Space> {
    const space = await this.spaces.findById(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }

    try {
      space.update(command.patch);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid space update',
      );
    }

    return this.spaces.save(space);
  }
}
