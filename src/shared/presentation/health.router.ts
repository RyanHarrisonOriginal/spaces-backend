import { Router } from 'express';

import { mount } from '../../http/mount';
import { send } from '../../http/send';
import { HealthRoutes } from './health.routes';

export function createHealthRouter(): Router {
  const router = Router();

  mount(router, HealthRoutes.check, (_req, res) => {
    send(res, HealthRoutes.check.status, { status: 'ok' });
  });

  return router;
}
