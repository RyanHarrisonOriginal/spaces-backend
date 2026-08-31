export interface ContentItemReadModel {
  id: string;
  collectionId: string;
  provider: 'youtube';
  externalId: string;
  type: 'video' | 'article' | 'image';
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  discoveredByQueries: string[];
  sortOrder: number;
  createdAt: Date;
}

export interface CollectionReadModel {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  queries: string[];
  content: ContentItemReadModel[];
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
