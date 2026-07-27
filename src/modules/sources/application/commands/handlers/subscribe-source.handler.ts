import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../../users/domain/user.repository';
import { SourceSubscription } from '../../../domain/source-subscription.entity';
import {
  SOURCE_SUBSCRIPTION_REPOSITORY,
  SourceSubscriptionRepository,
} from '../../../domain/source-subscription.repository';
import {
  SOURCE_REPOSITORY,
  SourceRepository,
} from '../../../domain/source.repository';
import { SubscribeSourceCommand } from '../subscribe-source.command';

@CommandHandler(SubscribeSourceCommand)
export class SubscribeSourceHandler
  implements ICommandHandler<SubscribeSourceCommand>
{
  constructor(
    @Inject(SOURCE_REPOSITORY)
    private readonly sources: SourceRepository,
    @Inject(SOURCE_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SourceSubscriptionRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: SubscribeSourceCommand): Promise<SourceSubscription> {
    const user = await this.users.findById(command.userId);
    if (!user) throw new NotFoundException('User', command.userId);

    const source = await this.sources.findById(command.sourceId);
    if (!source || !source.isActive) {
      throw new NotFoundException('Source', command.sourceId);
    }

    const existing = await this.subscriptions.findByUserAndSource(
      command.userId,
      command.sourceId,
    );

    if (existing) {
      if (existing.status === 'active') return existing;
      existing.activate();
      return this.subscriptions.save(existing);
    }

    try {
      const subscription = SourceSubscription.create({
        id: randomUUID(),
        userId: command.userId,
        sourceId: command.sourceId,
      });
      return this.subscriptions.save(subscription);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid subscription',
      );
    }
  }
}
