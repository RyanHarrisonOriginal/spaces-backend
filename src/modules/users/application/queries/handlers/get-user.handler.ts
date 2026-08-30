
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  UserRepository,
} from '../../../domain/user.repository';
import { GetUserQuery } from '../get-user.query';

export class GetUserHandler {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.users.get(query.userId);
    if (!user) {
      throw new NotFoundException('User', query.userId);
    }
    return user;
  }
}
