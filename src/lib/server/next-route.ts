import { RouteError } from './route-error';

export function cacheHeaders(maxAgeSeconds = 0): HeadersInit | undefined {
  if (maxAgeSeconds <= 0) return undefined;
  return {
    'Cache-Control': `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 4}`,
  };
}

export function routeErrorResponse(err: unknown, fallbackMessage = 'حدث خطأ في الخادم'): Response {
  if (err instanceof RouteError) {
    return Response.json(
      { error: err.message, ...(err.details ? { details: err.details } : {}) },
      { status: err.status },
    );
  }
  return Response.json(
    {
      error: err instanceof Error ? err.message : fallbackMessage,
    },
    { status: 500 },
  );
}
