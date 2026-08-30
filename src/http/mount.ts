import type { RequestHandler, Router } from 'express';

import type { HttpRoute } from './http-route';

export function mount(
  router: Router,
  route: HttpRoute,
  ...handlers: RequestHandler[]
): void {
  router[route.method](route.path, ...handlers);
}
