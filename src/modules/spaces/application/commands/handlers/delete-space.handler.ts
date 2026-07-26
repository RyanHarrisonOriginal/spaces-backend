import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { DeleteSpaceCommand } from '../delete-space.command';

@CommandHandler(DeleteSpaceCommand)
export class DeleteSpaceHandler implements ICommandHandler<DeleteSpaceCommand> {
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: DeleteSpaceCommand): Promise<void> {
    const space = await this.spaces.findById(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }
    await this.spaces.delete(command.spaceId);
  }
}
