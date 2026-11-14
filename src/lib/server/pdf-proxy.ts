import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { prisma } from './prisma';
import { safeDecodeSlug } from './arabic';
import { escapeBookText, readableChapter } from './text-formatters';

const PROXY_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrthodoxPortal/1.0';

function pdfUpstreamUrl(sourceUrl: string, driveFileId?: string | null): string {
  return driveFileId
    ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveFileId)}&export=download&confirm=t`
    : sourceUrl;
}

async function resolveLocalCachedFile(storageKey: string | null): Promise<string | null> {
  if (!storageKey) return null;
  const candidateRoots = [
    process.env.STORAGE_DIR ? path.resolve(process.cwd(), process.env.STORAGE_DIR) : null,
    path.resolve(process.cwd(), 'storage/books'),
    path.resolve(process.cwd(), '../api/storage/books'),
  ].filter((root): root is string => Boolean(root));

  for (const root of candidateRoots) {
    const filePath = path.join(root, storageKey);
    try {
      const stat = await fsp.stat(filePath);
      if (stat.isFile() && stat.size > 1024) {
        return filePath;
      }
    } catch {
      // File not present on this runtime container; stateless upstream proxy handles it.
    }
  }
  return null;
}

function combineSignals(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeoutSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal]);
  }
  return signal;
}

async function fetchPdfResponse(
  sourceUrl: string,
  driveFileId: string | null,
  rangeHeader?: string | null,
  signal?: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = { 'User-Agent': PROXY_USER_AGENT };
  if (rangeHeader) headers.Range = rangeHeader;

  const requestSignal = combineSignals(signal, 90_000);
  const res = await fetch(pdfUpstreamUrl(sourceUrl, driveFileId), {
    signal: requestSignal,
    redirect: 'follow',
    headers,
  });

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (driveFileId && contentType.includes('text/html')) {
    const html = await res.text();
    const confirmMatch =
      html.match(/name="confirm"\s+value="([^"]+)"/) || html.match(/confirm=([0-9A-Za-z_-]+)/);
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);

    if (confirmMatch?.[1]) {
      const confirmedUrl = new URL('https://drive.usercontent.google.com/download');
      confirmedUrl.searchParams.set('id', driveFileId);
      confirmedUrl.searchParams.set('export', 'download');
      confirmedUrl.searchParams.set('confirm', confirmMatch[1]);
      if (uuidMatch?.[1]) confirmedUrl.searchParams.set('uuid', uuidMatch[1]);

      return fetch(confirmedUrl.toString(), {
        signal: combineSignals(signal, 90_000),
        redirect: 'follow',
        headers,
      });
    }
    throw new Error('Google Drive returned HTML confirmation page instead of PDF');
  }

  return res;
}

function buildLocalFileResponse(
  filePath: string,
  fileSize: number,
  rangeHeader: string | null,
  extraHeaders: Record<string, string>,
): Response {
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? Math.min(parseInt(endStr, 10), fileSize - 1) : fileSize - 1;

    if (Number.isNaN(start) || start >= fileSize || start > end) {
      headers.set('Content-Range', `bytes */${fileSize}`);
      return new Response(null, { status: 416, headers });
    }

    const chunkSize = end - start + 1;
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    headers.set('Content-Length', String(chunkSize));
    const webStream = Readable.toWeb(fs.createReadStream(filePath, { start, end })) as ReadableStream;
    return new Response(webStream, { status: 206, headers });
  }

  headers.set('Content-Length', String(fileSize));
  const webStream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  return new Response(webStream, { status: 200, headers });
}

export async function handleBookStream(slug: string, request: Request): Promise<Response> {
  const book = await prisma.book.findUnique({
    where: { slug: safeDecodeSlug(slug) },
    select: { id: true, storageKey: true, pdfSourceUrl: true, driveFileId: true },
  });
  if (!book) {
    return Response.json({ error: 'الكتاب غير موجود' }, { status: 404 });
  }

  const range = request.headers.get('range');
  const localPath = await resolveLocalCachedFile(book.storageKey);
  if (localPath) {
    const stat = await fsp.stat(localPath);
    return buildLocalFileResponse(localPath, stat.size, range, {
      'Cache-Control': 'public, max-age=86400',
    });
  }

  if (!book.pdfSourceUrl && !book.driveFileId) {
    return Response.json({ error: 'لا يتوفر ملف PDF لهذا الكتاب حالياً' }, { status: 404 });
  }

  try {
    const upstream = await fetchPdfResponse(book.pdfSourceUrl || '', book.driveFileId, range, request.signal);
    const ct = (upstream.headers.get('content-type') || '').toLowerCase();
    if (!upstream.ok || !upstream.body || !/^(application\/pdf|application\/octet-stream)/.test(ct)) {
      await upstream.body?.cancel();
      return Response.json(
        { error: 'تعذر فتح ملف الـ PDF من المصدر حالياً', details: `Upstream HTTP ${upstream.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Accept-Ranges': upstream.headers.get('accept-ranges') || 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (cl && !upstream.headers.has('content-encoding')) headers.set('Content-Length', cl);
    if (cr) headers.set('Content-Range', cr);

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return Response.json(
      {
        error: 'تعذر فتح ملف الـ PDF من المصدر حالياً',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}

export async function handleBookDownload(slug: string, request?: Request): Promise<Response> {
  const book = await prisma.book.findUnique({
    where: { slug: safeDecodeSlug(slug) },
    select: {
      id: true,
      title: true,
      format: true,
      sourcePageUrl: true,
      sourceSite: true,
      storageKey: true,
      pdfSourceUrl: true,
      driveFileId: true,
      author: { select: { name: true } },
    },
  });
  if (!book) {
    return Response.json({ error: 'الكتاب غير موجود' }, { status: 404 });
  }

  if (book.format === 'HTML_CHAPTERS') {
    const chapters = await prisma.bookChapter.findMany({
      where: { bookId: book.id },
      orderBy: { chapterNumber: 'asc' },
      select: { title: true, contentHtml: true },
    });
    if (!chapters.length) {
      return Response.json({ error: 'لا توجد فصول متاحة للتحميل' }, { status: 404 });
    }
    const title = escapeBookText(book.title);
    const sections = chapters
      .map((chapter) => `<section><h2>${escapeBookText(chapter.title)}</h2>${readableChapter(chapter.contentHtml)}</section>`)
      .join('\n');
    const source = escapeBookText(book.sourcePageUrl);
    const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:2rem auto;padding:0 1rem;max-width:52rem;font:1.15rem/1.9 system-ui;color:#24211d}section{margin:2rem 0}a{overflow-wrap:anywhere}</style><main><h1>${title}</h1><p>${escapeBookText(book.author.name)}</p><p>المصدر: <a href="${source}">${escapeBookText(book.sourceSite)}</a></p>${sections}</main></html>`;

    void prisma.book.update({ where: { id: book.id }, data: { downloadsCount: { increment: 1 } } }).catch(() => {});

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="book-${book.id}.html"; filename*=UTF-8''${encodeURIComponent(`${book.title}.html`)}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const disposition = `attachment; filename="book-${book.id}.pdf"; filename*=UTF-8''${encodeURIComponent(`${book.title}.pdf`)}`;
  const localPath = await resolveLocalCachedFile(book.storageKey);
  if (localPath) {
    const stat = await fsp.stat(localPath);
    void prisma.book.update({ where: { id: book.id }, data: { downloadsCount: { increment: 1 } } }).catch(() => {});
    return buildLocalFileResponse(localPath, stat.size, null, {
      'Content-Disposition': disposition,
    });
  }

  if (!book.pdfSourceUrl && !book.driveFileId) {
    return Response.json({ error: 'لا يتوفر ملف تحميل لهذا الكتاب حالياً' }, { status: 404 });
  }

  try {
    const upstream = await fetchPdfResponse(book.pdfSourceUrl || '', book.driveFileId, null, request?.signal);
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !upstream.body || !/^(application\/pdf|application\/octet-stream)/i.test(type)) {
      await upstream.body?.cancel();
      return Response.json(
        { error: 'تعذر تحميل الكتاب من المصدر حالياً', details: `PDF unavailable (HTTP ${upstream.status})` },
        { status: 502 },
      );
    }

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
    });
    const length = upstream.headers.get('content-length');
    if (length && !upstream.headers.has('content-encoding')) {
      headers.set('Content-Length', length);
    }

    void prisma.book.update({ where: { id: book.id }, data: { downloadsCount: { increment: 1 } } }).catch(() => {});
    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    return Response.json(
      {
        error: 'تعذر تحميل الكتاب من المصدر حالياً',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
