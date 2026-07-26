import { ContentType, ThingStatus } from '@prisma/client';

export interface ThingReadModel {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  status: ThingStatus;
  sortOrder: number;
  contentTypes: ContentType[];
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
