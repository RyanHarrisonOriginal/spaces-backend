import { Repository } from '../../../shared/domain/repository';
import { Space } from './space.entity';

export abstract class SpaceRepository extends Repository<Space> {
  abstract findByUserId(userId: string): Promise<Space[]>;
}

export const SPACE_REPOSITORY = Symbol('SPACE_REPOSITORY');
