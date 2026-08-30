import type { HttpRoute } from '../../../http/http-route';

export const ContentRoutes = {
  list: {
    method: 'get',
    path: '/collections/:collectionId/content',
    status: 200,
  },
  replace: {
    method: 'put',
    path: '/collections/:collectionId/content',
    status: 200,
  },
} as const satisfies Record<string, HttpRoute>;
