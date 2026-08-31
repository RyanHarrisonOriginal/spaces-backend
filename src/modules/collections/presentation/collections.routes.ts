import type { HttpRoute } from '../../../http/http-route';

export const CollectionRoutes = {
  create: {
    method: 'post',
    path: '/spaces/:spaceId/collections',
    status: 201,
  },
  update: {
    method: 'patch',
    path: '/collections/:collectionId',
    status: 200,
  },
  remove: {
    method: 'delete',
    path: '/collections/:collectionId',
    status: 204,
  },
  enqueueDiscoveryProfile: {
    method: 'post',
    path: '/collections/:collectionId/discovery-profile',
    status: 202,
  },
  listGatherQueries: {
    method: 'get',
    path: '/collections/:collectionId/gather-queries',
    status: 200,
  },
  replaceGatherQueries: {
    method: 'put',
    path: '/collections/:collectionId/gather-queries',
    status: 200,
  },
  gather: {
    method: 'post',
    path: '/collections/:collectionId/gather',
    status: 202,
  },
  getGatherJob: {
    method: 'get',
    path: '/collections/:collectionId/gather/:jobId',
    status: 200,
  },
} as const satisfies Record<string, HttpRoute>;
