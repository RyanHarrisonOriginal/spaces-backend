import { Repository } from '../../../shared/domain/repository';
import { Source } from './source.entity';

export const SOURCE_REPOSITORY = Symbol('SOURCE_REPOSITORY');

export abstract class SourceRepository extends Repository<Source> {
  abstract findAllActive(): Promise<Source[]>;
}
