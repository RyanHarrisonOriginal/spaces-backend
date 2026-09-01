export function isoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function joinedDescription(
  description?: string,
  extraSnippets?: string[],
): string {
  const extra = (extraSnippets ?? [])
    .map((snippet) => snippet.trim())
    .filter(Boolean);
  return [description?.trim() ?? '', ...extra].filter(Boolean).join('\n');
}
