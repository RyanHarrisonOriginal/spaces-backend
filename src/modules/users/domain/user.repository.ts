import { Repository } from '../../../shared/domain/repository';
import { User } from './user.entity';

export abstract class UserRepository extends Repository<User> {
  abstract findByEmail(email: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
