import { getOfflineBundle, OFFLINE_PARTS, type OfflinePart } from '@/lib/server/offline-bundles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const part = (searchParams.get('part') || 'core') as OfflinePart;
  const fmt = searchParams.get('fmt');

  if (!OFFLINE_PARTS.includes(part)) {
    return Response.json({ error: 'قسم البيانات غير صالح', parts: OFFLINE_PARTS }, { status: 400 });
  }

  const entry = await getOfflineBundle(part);

  if (fmt === 'gz') {
    return new Response(entry.gzipBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Payload-Compression': 'gzip',
        'X-Uncompressed-Bytes': String(entry.jsonBytes.byteLength),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  return new Response(entry.jsonBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
