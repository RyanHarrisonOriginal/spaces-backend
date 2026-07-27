import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SOURCE_SUBSCRIPTION_REPOSITORY,
  SourceSubscriptionRepository,
} from '../../../domain/source-subscription.repository';
import { UnsubscribeSourceCommand } from '../unsubscribe-source.command';

@CommandHandler(UnsubscribeSourceCommand)
export class UnsubscribeSourceHandler
  implements ICommandHandler<UnsubscribeSourceCommand>
{
  constructor(
    @Inject(SOURCE_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SourceSubscriptionRepository,
  ) {}

  async execute(command: UnsubscribeSourceCommand): Promise<void> {
    const existing = await this.subscriptions.findByUserAndSource(
      command.userId,
      command.sourceId,
    );
    if (!existing) {
      throw new NotFoundException('SourceSubscription', command.sourceId);
    }
    existing.cancel();
    await this.subscriptions.save(existing);
  }
}
