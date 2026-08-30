import { Router } from 'express';

import type { AppContainer } from '../../../http/container';
import { asyncHandler } from '../../../http/async-handler';
import { mount } from '../../../http/mount';
import { requireUserId } from '../../../http/require-user-id';
import { requireUuidParam, routeParam } from '../../../http/require-uuid-param';
import { send } from '../../../http/send';
import { validateBody } from '../../../http/validate-body';
import { ReplaceContentItemsCommand } from '../application/commands/replace-content-items.command';
import { ReplaceContentItemsDto } from '../application/dto/replace-content-items.dto';
import { ListContentItemsQuery } from '../application/queries/list-content-items.query';
import { ContentRoutes } from './content.routes';

export function createContentRouter(container: AppContainer): Router {
  const router = Router();

  mount(
    router,
    ContentRoutes.list,
    requireUserId,
    requireUuidParam('collectionId'),
    asyncHandler(async (req, res) => {
      const result = await container.listContentItems.execute(
        new ListContentItemsQuery(
          req.userId!,
          routeParam(req, 'collectionId'),
        ),
      );
      send(res, ContentRoutes.list.status, result);
    }),
  );

  mount(
    router,
    ContentRoutes.replace,
    requireUserId,
    requireUuidParam('collectionId'),
    validateBody(ReplaceContentItemsDto),
    asyncHandler(async (req, res) => {
      const result = await container.replaceContentItems.execute(
        new ReplaceContentItemsCommand(
          req.userId!,
          routeParam(req, 'collectionId'),
          req.body.items,
        ),
      );
      send(res, ContentRoutes.replace.status, result);
    }),
  );

  return router;
}
