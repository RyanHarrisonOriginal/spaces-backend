import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UserId } from '../../../shared/presentation/decorators/user-id.decorator';
import { SubscribeSourceCommand } from '../application/commands/subscribe-source.command';
import { UnsubscribeSourceCommand } from '../application/commands/unsubscribe-source.command';
import { ListSourcesQuery } from '../application/queries/list-sources.query';
import { ListUserSubscriptionsQuery } from '../application/queries/list-user-subscriptions.query';
import { SourceSubscription } from '../domain/source-subscription.entity';
import { Source } from '../domain/source.entity';

@Controller('sources')
export class SourcesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(): Promise<Source[]> {
    return this.queryBus.execute(new ListSourcesQuery());
  }

  @Get('subscriptions')
  async listSubscriptions(
    @UserId() userId: string,
  ): Promise<SourceSubscription[]> {
    return this.queryBus.execute(new ListUserSubscriptionsQuery(userId));
  }

  @Post(':sourceId/subscribe')
  async subscribe(
    @UserId() userId: string,
    @Param('sourceId') sourceId: string,
  ): Promise<SourceSubscription> {
    return this.commandBus.execute(
      new SubscribeSourceCommand(userId, sourceId),
    );
  }

  @Delete(':sourceId/subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @UserId() userId: string,
    @Param('sourceId') sourceId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnsubscribeSourceCommand(userId, sourceId),
    );
  }
}
