import { Repository } from '../../../shared/domain/repository';
import { Collection } from './collection.entity';

export abstract class CollectionRepository extends Repository<Collection> {
  abstract findBySpaceId(spaceId: string): Promise<Collection[]>;
}

export const COLLECTION_REPOSITORY = Symbol('COLLECTION_REPOSITORY');
