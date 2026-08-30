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
import { PrismaGatherQueryRepository } from '../modules/collections/infrastructure/prisma-gather-query.repository';
import { ReplaceContentItemsHandler } from '../modules/content/application/commands/handlers/replace-content-items.handler';
import { ListContentItemsHandler } from '../modules/content/application/queries/handlers/list-content-items.handler';
import { PrismaContentItemRepository } from '../modules/content/infrastructure/prisma-content-item.repository';
import { ListSourcesHandler } from '../modules/sources/application/queries/handlers/list-sources.handler';
import { PrismaSourceRepository } from '../modules/sources/infrastructure/prisma-source.repository';
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
  const users = new PrismaUserRepository(prisma);
  const spaces = new PrismaSpaceRepository(prisma);
  const collections = new PrismaCollectionRepository(prisma);
  const gatherQueries = new PrismaGatherQueryRepository(prisma);
  const contentItems = new PrismaContentItemRepository(prisma);
  const sources = new PrismaSourceRepository(prisma);
  const access = new CollectionAccessService(collections, spaces);

  return {
    prisma,
    createUser: new CreateUserHandler(users),
    bootstrapUser: new BootstrapUserHandler(users),
    getUser: new GetUserHandler(users),
    updateUser: new UpdateUserHandler(users),
    listSpaces: new ListSpacesHandler(spaces),
    createSpace: new CreateSpaceHandler(spaces, users),
    getSpaceTree: new GetSpaceTreeHandler(spaces, prisma),
    updateSpace: new UpdateSpaceHandler(spaces),
    deleteSpace: new DeleteSpaceHandler(spaces),
    createCollection: new CreateCollectionHandler(collections, spaces),
    updateCollection: new UpdateCollectionHandler(collections, spaces),
    deleteCollection: new DeleteCollectionHandler(collections, spaces),
    enqueueDiscoveryProfile: new EnqueueCollectionDiscoveryProfileHandler(
      access,
    ),
    listGatherQueries: new ListGatherQueriesHandler(gatherQueries, access),
    replaceGatherQueries: new ReplaceGatherQueriesHandler(
      gatherQueries,
      access,
    ),
    gatherCollection: new GatherCollectionHandler(
      access,
      gatherQueries,
      prisma,
    ),
    listContentItems: new ListContentItemsHandler(contentItems, access),
    replaceContentItems: new ReplaceContentItemsHandler(contentItems, access),
    listSources: new ListSourcesHandler(sources),
  };
}
