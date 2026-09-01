export type GenericThumbnailKind = 'article' | 'video' | 'image';

export function genericContentThumbnail(kind: GenericThumbnailKind): string {
  const label =
    kind === 'video' ? 'Video' : kind === 'image' ? 'Image' : 'Page';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#171717"/><text x="320" y="188" text-anchor="middle" fill="#737373" font-family="Arial,sans-serif" font-size="32">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function thumbnailOrFallback(
  url: string | undefined,
  kind: GenericThumbnailKind,
): string {
  const trimmed = url?.trim();
  return trimmed || genericContentThumbnail(kind);
}
