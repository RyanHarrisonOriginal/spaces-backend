export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type HttpRoute = {
  method: HttpMethod;
  path: string;
  status: number;
};
