import { ZodError } from 'zod';

import {
  ContentSearchError,
  isSearchRateLimit,
} from '../../application/errors/content-search.error';

export type BraveFetch = (
  input: string | URL,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

const REQUEST_TIMEOUT_MS = 12_000;

export function resolveBraveApiKey(current: string): string {
  return (current || process.env.BRAVE_SEARCH_API_KEY || '').trim();
}

export function requireBraveApiKey(apiKey: string): string {
  const resolved = resolveBraveApiKey(apiKey);
  if (!resolved) {
    throw new ContentSearchError(
      'Brave Search API key is not configured',
      'configuration',
    );
  }
  return resolved;
}

export async function braveGetJson(options: {
  fetch: BraveFetch;
  apiKey: string;
  url: URL;
}): Promise<unknown> {
  const apiKey = requireBraveApiKey(options.apiKey);
  let response: Awaited<ReturnType<BraveFetch>>;
  try {
    response = await options.fetch(options.url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new ContentSearchError(
      timedOut
        ? 'Brave search request timed out'
        : 'Brave search request failed',
      'provider',
      { cause: timedOut ? 'timeout' : 'network' },
    );
  }

  let body: unknown;
  try {
    const text = await response.text();
    body = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new ContentSearchError(
      'Brave returned an unexpected response',
      'provider',
      { status: response.status },
    );
  }

  if (!response.ok) {
    const details = detailsForBraveFailure(response.status, body);
    throw new ContentSearchError(
      messageForBraveFailure(response.status, body),
      isSearchRateLimit(details) ? 'rate_limit' : 'provider',
      details,
    );
  }

  return body;
}

export function mapBraveParseError(error: unknown): never {
  if (error instanceof ZodError || error instanceof ContentSearchError) {
    throw new ContentSearchError(
      'Brave returned an unexpected response',
      'provider',
    );
  }
  throw error;
}

function messageForBraveFailure(status: number, body: unknown): string {
  const { reason, message } = braveErrorFromBody(body);
  const parts = [`Brave search failed (HTTP ${status})`];
  if (reason) {
    parts.push(`reason=${reason}`);
  }
  if (message) {
    parts.push(message);
  }
  return parts.join(': ');
}

function detailsForBraveFailure(
  status: number,
  body: unknown,
): Record<string, unknown> {
  const { reason, message } = braveErrorFromBody(body);
  return {
    status,
    ...(reason ? { reason } : {}),
    ...(message ? { braveMessage: message } : {}),
  };
}

function braveErrorFromBody(body: unknown): {
  reason?: string;
  message?: string;
} {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const record = body as {
    type?: unknown;
    message?: unknown;
    error?: unknown;
  };
  const error =
    record.error && typeof record.error === 'object'
      ? (record.error as { code?: unknown; detail?: unknown; message?: unknown })
      : undefined;
  const reason =
    typeof error?.code === 'string'
      ? error.code.trim()
      : typeof record.type === 'string'
        ? record.type.trim()
        : undefined;
  const rawMessage =
    (typeof error?.detail === 'string' && error.detail) ||
    (typeof error?.message === 'string' && error.message) ||
    (typeof record.message === 'string' && record.message) ||
    '';
  const message = sanitizeBraveMessage(rawMessage);

  return {
    ...(reason ? { reason } : {}),
    ...(message ? { message } : {}),
  };
}

function sanitizeBraveMessage(value: string): string {
  const stripped = value.replace(/\s+/g, ' ').trim();
  if (!stripped) {
    return '';
  }
  return stripped.slice(0, 200);
}
