import { PrismaClient } from '@prisma/client';

import { getPrisma } from '../../packages/db/src';
import { CollectionAccessService } from '../modules/collections/application/services/collection-access.service';
import { CreateCollectionHandler } from '../modules/collections/application/commands/handlers/create-collection.handler';
import { DeleteCollectionHandler } from '../modules/collections/application/commands/handlers/delete-collection.handler';
import { EnqueueCollectionDiscoveryProfileHandler } from '../modules/collections/application/commands/handlers/enqueue-collection-discovery-profile.handler';
import { GatherCollectionHandler } from '../modules/collections/application/commands/handlers/gather-collection.handler';
import { ReplaceGatherQueriesHandler } from '../modules/collections/application/commands/handlers/replace-gather-queries.handler';
import { UpdateCollectionHandler } from '../modules/collections/application/commands/handlers/update-collection.handler';
import { ListGatherQueriesHandler } from '../modules/collections/application/queries/handlers/list-gather-queries.handler';
import { PrismaCollectionRepository } from '../modules/collections/infrastructure/prisma-collection.repository';
import {
  PrismaCollectionDiscoveryProfileRepository,
  YoutubeSearchAdapter,
} from '../../packages/discovery/src';
import { PrismaGatherQueryRepository } from '../../packages/persistence/src';
import { GatherCollectionService } from '../modules/collections/application/services/gather-collection.service';
import { CreateSpaceHandler } from '../modules/spaces/application/commands/handlers/create-space.handler';
import { DeleteSpaceHandler } from '../modules/spaces/application/commands/handlers/delete-space.handler';
import { UpdateSpaceHandler } from '../modules/spaces/application/commands/handlers/update-space.handler';
import { GetSpaceTreeHandler } from '../modules/spaces/application/queries/handlers/get-space-tree.handler';
import { ListSpacesHandler } from '../modules/spaces/application/queries/handlers/list-spaces.handler';
import { PrismaSpaceRepository } from '../modules/spaces/infrastructure/prisma-space.repository';
import { BootstrapUserHandler } from '../modules/users/application/commands/handlers/bootstrap-user.handler';
import { CreateUserHandler } from '../modules/users/application/commands/handlers/create-user.handler';
import { UpdateUserHandler } from '../modules/users/application/commands/handlers/update-user.handler';
import { GetUserHandler } from '../modules/users/application/queries/handlers/get-user.handler';
import { PrismaUserRepository } from '../modules/users/infrastructure/prisma-user.repository';

export type AppContainer = ReturnType<typeof createContainer>;

export function createContainer(prisma: PrismaClient = getPrisma()) {
  const userRepo = new PrismaUserRepository(prisma);
  const spaceRepo = new PrismaSpaceRepository(prisma);
  const collectionRepo = new PrismaCollectionRepository(prisma);
  const gatherQueryRepo = new PrismaGatherQueryRepository(prisma);
  const profileRepo = new PrismaCollectionDiscoveryProfileRepository(prisma);
  const collectionAccessService = new CollectionAccessService(
    collectionRepo,
    spaceRepo,
  );
  const gatherCollectionService = new GatherCollectionService(
    gatherQueryRepo,
    profileRepo,
    YoutubeSearchAdapter.fromEnv(),
  );

  return {
    prisma,
    createUser: new CreateUserHandler(userRepo),
    bootstrapUser: new BootstrapUserHandler(userRepo),
    getUser: new GetUserHandler(userRepo),
    updateUser: new UpdateUserHandler(userRepo),
    listSpaces: new ListSpacesHandler(spaceRepo),
    createSpace: new CreateSpaceHandler(spaceRepo, userRepo),
    getSpaceTree: new GetSpaceTreeHandler(spaceRepo, prisma),
    updateSpace: new UpdateSpaceHandler(spaceRepo),
    deleteSpace: new DeleteSpaceHandler(spaceRepo),
    createCollection: new CreateCollectionHandler(collectionRepo, spaceRepo),
    updateCollection: new UpdateCollectionHandler(collectionRepo, spaceRepo),
    deleteCollection: new DeleteCollectionHandler(collectionRepo, spaceRepo),
    enqueueDiscoveryProfile: new EnqueueCollectionDiscoveryProfileHandler(
      collectionAccessService,
    ),
    listGatherQueries: new ListGatherQueriesHandler(
      gatherQueryRepo,
      collectionAccessService,
    ),
    replaceGatherQueries: new ReplaceGatherQueriesHandler(
      gatherQueryRepo,
      collectionAccessService,
    ),
    gatherCollection: new GatherCollectionHandler(
      collectionAccessService,
      gatherCollectionService,
    ),
  };
}
