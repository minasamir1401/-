import { ApiError } from './api-client';
import { dispatchServerGet } from './server/dispatch';
import { RouteError } from './server/route-error';

export * from './api-client';

export function getServerApiBase(): string {
  return (process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
}

export async function fetchServerApi<T>(path: string, revalidate = 60): Promise<T> {
  const externalBase = process.env.API_INTERNAL_BASE_URL?.trim();
  if (externalBase) {
    const res = await fetch(`${externalBase.replace(/\/$/, '')}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) {
      throw new ApiError(res.status, path);
    }
    return res.json() as Promise<T>;
  }

  try {
    return (await dispatchServerGet(path)) as T;
  } catch (err) {
    if (err instanceof RouteError) {
      throw new ApiError(err.status, path);
    }
    throw err;
  }
}
