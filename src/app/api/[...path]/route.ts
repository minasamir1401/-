import { dispatchServerGet } from '@/lib/server/dispatch';
import { cacheHeaders, routeErrorResponse } from '@/lib/server/next-route';
import { handleBookDownload, handleBookStream } from '@/lib/server/pdf-proxy';

function resolveCacheTtl(pathname: string): number {
  if (
    pathname === '/api/bible/books' ||
    pathname === '/api/commentaries/books' ||
    pathname === '/api/books/defense-featured' ||
    pathname === '/api/liturgy/books' ||
    pathname.startsWith('/api/bible/books/') ||
    pathname.startsWith('/api/liturgy/agpeya/')
  ) {
    return 3600;
  }
  if (
    pathname === '/api/books/meta' ||
    pathname === '/api/explanations/categories' ||
    pathname === '/api/sermons/preachers' ||
    pathname === '/api/synaxarium' ||
    pathname.startsWith('/api/apologetics')
  ) {
    return 600;
  }
  if (pathname === '/api/liturgy/today' || pathname === '/api/synaxarium/today' || pathname.startsWith('/api/authors/') || pathname.startsWith('/api/preachers/')) {
    return 300;
  }
  if (pathname === '/api/stats' || pathname === '/api/books' || pathname === '/api/explanations' || pathname === '/api/sermons' || pathname === '/api/commentaries') {
    return 120;
  }
  if (pathname === '/api/search' || pathname === '/api/bible/search') {
    return 30;
  }
  return 0;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/api/${path.map((segment) => encodeURIComponent(segment)).join('/')}`;

  const bookStreamMatch = pathname.match(/^\/api\/books\/([^/]+)\/stream$/);
  if (bookStreamMatch) {
    return handleBookStream(bookStreamMatch[1], request);
  }

  const bookDownloadMatch = pathname.match(/^\/api\/books\/([^/]+)\/download$/);
  if (bookDownloadMatch) {
    return handleBookDownload(bookDownloadMatch[1], request);
  }

  try {
    const reqUrl = new URL(request.url);
    const data = await dispatchServerGet(`${pathname}${reqUrl.search}`);
    return Response.json(data, {
      status: 200,
      headers: cacheHeaders(resolveCacheTtl(pathname)),
    });
  } catch (err) {
    return routeErrorResponse(err);
  }
}
