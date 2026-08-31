import { Router } from 'express';

import type { AppContainer } from '../../../http/container';
import { asyncHandler } from '../../../http/async-handler';
import { mount } from '../../../http/mount';
import { requireUserId } from '../../../http/require-user-id';
import { requireJobIdParam, requireUuidParam, routeParam } from '../../../http/require-uuid-param';
import { send } from '../../../http/send';
import { validateBody } from '../../../http/validate-body';
import { CreateCollectionCommand } from '../application/commands/create-collection.command';
import { DeleteCollectionCommand } from '../application/commands/delete-collection.command';
import { EnqueueCollectionDiscoveryProfileCommand } from '../application/commands/enqueue-collection-discovery-profile.command';
import { GatherCollectionCommand } from '../application/commands/gather-collection.command';
import { GetGatherJobQuery } from '../application/queries/get-gather-job.query';
import { ReplaceGatherQueriesCommand } from '../application/commands/replace-gather-queries.command';
import { UpdateCollectionCommand } from '../application/commands/update-collection.command';
import { CreateCollectionDto } from '../application/dto/create-collection.dto';
import { ReplaceGatherQueriesDto } from '../application/dto/replace-gather-queries.dto';
import { UpdateCollectionDto } from '../application/dto/update-collection.dto';
import { ListGatherQueriesQuery } from '../application/queries/list-gather-queries.query';
import { CollectionRoutes } from './collections.routes';

export function createCollectionsRouter(container: AppContainer): Router {
  const router = Router();

  mount(
    router,
    CollectionRoutes.create,
    requireUserId,
    requireUuidParam('spaceId'),
    validateBody(CreateCollectionDto),
    asyncHandler(async (req, res) => {
      const result = await container.createCollection.execute(
        new CreateCollectionCommand(
          req.userId!,
          routeParam(req, 'spaceId'),
          req.body.name,
          req.body.description,
          req.body.sortOrder,
        ),
      );
      send(res, CollectionRoutes.create.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.update,
    requireUserId,
    requireUuidParam('collectionId'),
    validateBody(UpdateCollectionDto),
    asyncHandler(async (req, res) => {
      const result = await container.updateCollection.execute(
        new UpdateCollectionCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
          req.body,
        ),
      );
      send(res, CollectionRoutes.update.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.remove,
    requireUserId,
    requireUuidParam('collectionId'),
    asyncHandler(async (req, res) => {
      await container.deleteCollection.execute(
        new DeleteCollectionCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
        ),
      );
      send(res, CollectionRoutes.remove.status);
    }),
  );

  mount(
    router,
    CollectionRoutes.enqueueDiscoveryProfile,
    requireUserId,
    requireUuidParam('collectionId'),
    asyncHandler(async (req, res) => {
      const result = await container.enqueueDiscoveryProfile.execute(
        new EnqueueCollectionDiscoveryProfileCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
        ),
      );
      send(res, CollectionRoutes.enqueueDiscoveryProfile.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.listGatherQueries,
    requireUserId,
    requireUuidParam('collectionId'),
    asyncHandler(async (req, res) => {
      const result = await container.listGatherQueries.execute(
        new ListGatherQueriesQuery(
          req.userId!,
          routeParam(req, 'collectionId'),
        ),
      );
      send(res, CollectionRoutes.listGatherQueries.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.replaceGatherQueries,
    requireUserId,
    requireUuidParam('collectionId'),
    validateBody(ReplaceGatherQueriesDto),
    asyncHandler(async (req, res) => {
      const result = await container.replaceGatherQueries.execute(
        new ReplaceGatherQueriesCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
          req.body.queries,
        ),
      );
      send(res, CollectionRoutes.replaceGatherQueries.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.gather,
    requireUserId,
    requireUuidParam('collectionId'),
    asyncHandler(async (req, res) => {
      const result = await container.gatherCollection.execute(
        new GatherCollectionCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
        ),
      );
      send(res, CollectionRoutes.gather.status, result);
    }),
  );

  mount(
    router,
    CollectionRoutes.getGatherJob,
    requireUserId,
    requireUuidParam('collectionId'),
    requireJobIdParam('jobId'),
    asyncHandler(async (req, res) => {
      const result = await container.getGatherJob.execute(
        new GetGatherJobQuery(
          req.userId!,
          routeParam(req, 'collectionId'),
          routeParam(req, 'jobId'),
        ),
      );
      send(res, CollectionRoutes.getGatherJob.status, result);
    }),
  );

  return router;
}
