import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { GetUserQuery } from '../get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new NotFoundException('User', query.userId);
    }
    return user;
  }
}
