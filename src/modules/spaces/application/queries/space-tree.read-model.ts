export interface CollectionReadModel {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  queries: string[];
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
