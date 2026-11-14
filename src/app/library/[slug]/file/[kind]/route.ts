import { getBookChapter } from '@/lib/server/handlers/library';
import { handleBookDownload, handleBookStream } from '@/lib/server/pdf-proxy';
import { RouteError } from '@/lib/server/route-error';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; kind: string }> },
) {
  const { slug, kind } = await params;
  const isChapter = /^[1-9]\d{0,5}$/.test(kind);
  if (!isChapter && kind !== 'stream' && kind !== 'download') {
    return new Response(null, { status: 404 });
  }

  const externalBase = process.env.API_INTERNAL_BASE_URL?.trim();
  if (externalBase) {
    try {
      const path = isChapter ? `chapters/${kind}` : kind;
      const range = request.headers.get('range');
      const upstream = await fetch(
        `${externalBase.replace(/\/$/, '')}/api/books/${encodeURIComponent(decodeURIComponent(slug))}/${path}`,
        {
          cache: 'no-store',
          headers: range && kind === 'stream' ? { Range: range } : undefined,
          signal: request.signal,
        },
      );
      const headers = new Headers({ 'X-Content-Type-Options': 'nosniff' });
      for (const name of ['content-type', 'content-disposition', 'content-range', 'content-length', 'accept-ranges', 'cache-control']) {
        const value = upstream.headers.get(name);
        if (value && !(name === 'content-length' && upstream.headers.has('content-encoding'))) {
          headers.set(name, value);
        }
      }
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return new Response('تعذّر الاتصال بمكتبة المنارة حاليًا.', { status: 502 });
    }
  }

  try {
    if (isChapter) {
      const data = await getBookChapter(slug, kind);
      return Response.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }
    if (kind === 'stream') {
      return handleBookStream(slug, request);
    }
    return handleBookDownload(slug, request);
  } catch (err) {
    if (err instanceof RouteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return new Response('تعذّر الاتصال بمكتبة المنارة حاليًا.', { status: 502 });
  }
}
