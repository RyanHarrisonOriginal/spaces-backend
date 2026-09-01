export const CONTENT_SEARCH_PROVIDERS = {
  youtube: 'youtube',
  brave: 'brave',
} as const;

export type ContentSearchProviderName =
  (typeof CONTENT_SEARCH_PROVIDERS)[keyof typeof CONTENT_SEARCH_PROVIDERS];

export type ContentSearchResult = {
  provider: ContentSearchProviderName;
  externalId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  authorName?: string;
  publishedAt?: string;
  contentType?: 'video' | 'article' | 'image';
  discoveredByQueries: string[];
};

export interface ContentSearchProvider {
  search(query: string): Promise<ContentSearchResult[]>;
}
