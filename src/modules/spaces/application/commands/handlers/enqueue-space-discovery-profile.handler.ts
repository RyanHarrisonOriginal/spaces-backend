import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { enqueueGenerateSpaceDiscoveryProfile } from '../../../../../../packages/db/src';
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { EnqueueSpaceDiscoveryProfileCommand } from '../enqueue-space-discovery-profile.command';

@CommandHandler(EnqueueSpaceDiscoveryProfileCommand)
export class EnqueueSpaceDiscoveryProfileHandler
  implements
    ICommandHandler<EnqueueSpaceDiscoveryProfileCommand, { jobId: string }>
{
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: EnqueueSpaceDiscoveryProfileCommand,
  ): Promise<{ jobId: string }> {
    const space = await this.spaces.findById(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }

    const job = await enqueueGenerateSpaceDiscoveryProfile(
      this.prisma,
      command.spaceId,
    );
    return { jobId: job.id };
  }
}
