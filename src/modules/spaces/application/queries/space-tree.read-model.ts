import { ContentType, ThingStatus } from '@prisma/client';

export interface ContentItemReadModel {
  id: string;
  thingId: string;
  sourceId: string;
  type: ContentType;
  title: string;
  thumbnail: string;
  url: string | null;
  meta: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface ThingReadModel {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  status: ThingStatus;
  sortOrder: number;
  contentTypes: ContentType[];
  content: ContentItemReadModel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionReadModel {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  things: ThingReadModel[];
}

export interface SpaceTreeReadModel {
  id: string;
  userId: string;
  name: string;
  description: string;
  accent: string;
  headerFont: string;
  bgColor: string;
  textColor: string;
  view: 'card' | 'list';
  createdAt: Date;
  updatedAt: Date;
  collections: CollectionReadModel[];
}
