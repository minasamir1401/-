import { encodeMediaFileUrl, videos } from '@/lib/media-catalog';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = videos.find((item) => item.id === id);
  if (!video?.fileUrl) return new Response('الملف غير متاح للتحميل.', { status: 404 });

  const range = request.headers.get('range');
  const inline = new URL(request.url).searchParams.get('play') === '1';
  if (range && !/^bytes=(\d+-\d*|-\d+)$/.test(range)) return new Response(null, { status: 416 });
  try {
    const upstream = await fetch(encodeMediaFileUrl(video.fileUrl), {
      cache: 'no-store',
      headers: range ? { Range: range } : undefined,
      signal: request.signal,
    });
    if (upstream.status === 416) {
      return new Response(null, { status: 416, headers: { 'Content-Range': upstream.headers.get('content-range') || 'bytes */*' } });
    }
    if (!upstream.ok || !upstream.body || !/^(video\/mp4|application\/octet-stream)/i.test(upstream.headers.get('content-type') || '')) {
      await upstream.body?.cancel();
      return new Response('تعذر جلب الملف من الناشر.', { status: 502 });
    }
    const headers = new Headers({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${video.id}.mp4"; filename*=UTF-8''${encodeURIComponent(video.title + '.mp4')}`,
      'X-Content-Type-Options': 'nosniff',
    });
    for (const name of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response('تعذر الاتصال بمصدر الفيديو.', { status: 502 });
  }
}
