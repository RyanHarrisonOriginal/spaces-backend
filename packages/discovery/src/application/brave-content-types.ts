export const BRAVE_CONTENT_TYPES = {
  web: 'web',
  news: 'news',
  video: 'video',
  image: 'image',
} as const;

export type BraveContentType =
  (typeof BRAVE_CONTENT_TYPES)[keyof typeof BRAVE_CONTENT_TYPES];

export const DEFAULT_BRAVE_CONTENT_TYPES: BraveContentType[] = [
  BRAVE_CONTENT_TYPES.web,
];

const ALLOWED = new Set<string>(Object.values(BRAVE_CONTENT_TYPES));

export function isBraveContentType(value: string): value is BraveContentType {
  return ALLOWED.has(value);
}

export function normalizeBraveContentTypes(
  values?: readonly string[] | null,
): BraveContentType[] {
  const unique: BraveContentType[] = [];
  for (const value of values ?? []) {
    if (!isBraveContentType(value)) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }
  return unique.length > 0 ? unique : [...DEFAULT_BRAVE_CONTENT_TYPES];
}
