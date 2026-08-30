import type { HttpRoute } from '../../../http/http-route';

export const SpaceRoutes = {
  list: { method: 'get', path: '/spaces', status: 200 },
  create: { method: 'post', path: '/spaces', status: 201 },
  getTree: { method: 'get', path: '/spaces/:spaceId', status: 200 },
  update: { method: 'patch', path: '/spaces/:spaceId', status: 200 },
  remove: { method: 'delete', path: '/spaces/:spaceId', status: 204 },
} as const satisfies Record<string, HttpRoute>;
