import { Repository } from '../../../shared/domain/repository';
import { Thing } from './thing.entity';

export abstract class ThingRepository extends Repository<Thing> {
  abstract findByCollectionId(collectionId: string): Promise<Thing[]>;
}

export const THING_REPOSITORY = Symbol('THING_REPOSITORY');
