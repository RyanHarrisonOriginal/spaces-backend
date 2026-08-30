import type { HttpRoute } from '../../../http/http-route';

export const UserRoutes = {
  create: { method: 'post', path: '/users', status: 201 },
  bootstrap: { method: 'post', path: '/users/bootstrap', status: 201 },
  getById: { method: 'get', path: '/users/:id', status: 200 },
  update: { method: 'patch', path: '/users/:id', status: 200 },
} as const satisfies Record<string, HttpRoute>;
