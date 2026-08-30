import { Router } from 'express';

import type { AppContainer } from '../../../http/container';
import { asyncHandler } from '../../../http/async-handler';
import { mount } from '../../../http/mount';
import { send } from '../../../http/send';
import { ListSourcesQuery } from '../application/queries/list-sources.query';
import { SourceRoutes } from './sources.routes';

export function createSourcesRouter(container: AppContainer): Router {
  const router = Router();

  mount(
    router,
    SourceRoutes.list,
    asyncHandler(async (_req, res) => {
      const result = await container.listSources.execute(new ListSourcesQuery());
      send(res, SourceRoutes.list.status, result);
    }),
  );

  return router;
}
