import { BookStatus } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { getDailyLiturgy } from '@/lib/server/liturgy-service';
import { formatBibleCommentary } from '@/lib/server/text-formatters';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const OFFLINE_PARTS = [
  'core',
  'bible-1',
  'bible-2',
  'bible-3',
  'apologetics',
  'explanations',
  'commentaries-1',
  'commentaries-2',
  'commentaries-3',
  'commentaries-4',
  'commentaries-5',
  'commentaries-6',
  'synaxarium',
] as const;

type OfflinePart = (typeof OFFLINE_PARTS)[number];

interface CachedBundleEntry {
  jsonBytes: Buffer;
  expiresAt: number;
}

interface OfflineBundleStore {
  entries: Map<string, CachedBundleEntry>;
  inflight: Map<string, Promise<CachedBundleEntry>>;
  bibleBookLookup?: { expiresAt: number; map: Map<number, { slug: string; nameAr: string }> };
}

const globalStore = globalThis as unknown as { __orthodoxOfflineBundleCache?: OfflineBundleStore };
const bundleStore: OfflineBundleStore =
  globalStore.__orthodoxOfflineBundleCache ??
  (globalStore.__orthodoxOfflineBundleCache = {
    entries: new Map(),
    inflight: new Map(),
  });

async function getBibleBookMap(): Promise<Map<number, { slug: string; nameAr: string }>> {
  const cached = bundleStore.bibleBookLookup;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.map;
  }
  const books = await prisma.bibleBook.findMany({
    select: { id: true, slug: true, nameAr: true },
  });
  const map = new Map(books.map((b) => [b.id, { slug: b.slug, nameAr: b.nameAr }]));
  bundleStore.bibleBookLookup = { map, expiresAt: Date.now() + 3600_000 };
  return map;
}

async function buildCorePayload() {
  const [bibleBooks, books, authors, preachers, sermons, liturgyToday] = await Promise.all([
    prisma.bibleBook.findMany({
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        testament: true,
        orderIndex: true,
        chaptersCount: true,
      },
      orderBy: { orderIndex: 'asc' },
    }),
    prisma.book.findMany({
      where: { status: BookStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverUrl: true,
        format: true,
        pageCount: true,
        fileSizeBytes: true,
        sourceSite: true,
        author: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.author.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        _count: { select: { books: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.preacher.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        _count: { select: { sermons: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.sermon.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        mediaType: true,
        mediaUrl: true,
        durationSeconds: true,
        sourceName: true,
        preacher: { select: { name: true, slug: true } },
        series: { select: { title: true, slug: true } },
      },
      orderBy: { id: 'desc' },
    }),
    getDailyLiturgy().catch(() => null),
  ]);

  return {
    part: 'core',
    parts: OFFLINE_PARTS,
    bibleBooks,
    books: books.map((b) => ({
      ...b,
      fileSizeBytes: b.fileSizeBytes ? Number(b.fileSizeBytes) : null,
    })),
    authors,
    preachers,
    sermons,
    liturgyToday,
  };
}

async function loadBibleRange(minBookId: number, maxBookId: number) {
  const [bookMap, verses] = await Promise.all([
    getBibleBookMap(),
    prisma.bibleVerse.findMany({
      where: { bookId: { gte: minBookId, lte: maxBookId } },
      select: {
        bookId: true,
        chapter: true,
        verseNumber: true,
        textTashkeel: true,
      },
      orderBy: [{ bookId: 'asc' }, { chapter: 'asc' }, { verseNumber: 'asc' }],
    }),
  ]);

  const grouped = new Map<string, Array<[number, string]>>();
  for (const v of verses) {
    const slug = bookMap.get(v.bookId)?.slug;
    if (!slug) continue;
    const key = `${slug}:${v.chapter}`;
    let list = grouped.get(key);
    if (!list) {
      list = [];
      grouped.set(key, list);
    }
    list.push([v.verseNumber, v.textTashkeel]);
  }

  return Array.from(grouped.entries()).map(([key, items]) => {
    const [slug, chStr] = key.split(':');
    return { slug, chapter: Number(chStr), verses: items };
  });
}

async function loadCommentariesRange(minBookId: number, maxBookId: number) {
  const [bookMap, authors, rows] = await Promise.all([
    getBibleBookMap(),
    prisma.commentaryAuthor.findMany({ select: { id: true, name: true } }),
    prisma.bibleCommentary.findMany({
      where: { bookId: { gte: minBookId, lte: maxBookId } },
      select: {
        id: true,
        bookId: true,
        authorId: true,
        chapter: true,
        title: true,
        contentHtml: true,
        sourceName: true,
        sourceUrl: true,
      },
      orderBy: [{ bookId: 'asc' }, { chapter: 'asc' }, { id: 'asc' }],
    }),
  ]);

  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  return rows.map((row) => ({
    id: row.id,
    chapter: row.chapter,
    title: row.title,
    contentHtml: formatBibleCommentary(row.contentHtml),
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    book: bookMap.get(row.bookId) ?? { slug: String(row.bookId), nameAr: '' },
    author: { name: authorMap.get(row.authorId) ?? '' },
  }));
}

async function computePartPayload(part: OfflinePart): Promise<{ data: unknown; ttlMs: number }> {
  switch (part) {
    case 'core':
      return { data: await buildCorePayload(), ttlMs: 3600_000 };
    case 'bible-1':
      return { data: { part, chapters: await loadBibleRange(1, 22) }, ttlMs: 86_400_000 };
    case 'bible-2':
      return { data: { part, chapters: await loadBibleRange(23, 46) }, ttlMs: 86_400_000 };
    case 'bible-3':
      return { data: { part, chapters: await loadBibleRange(47, 80) }, ttlMs: 86_400_000 };
    case 'apologetics': {
      const entries = await prisma.apologeticsEntry.findMany({
        select: {
          id: true,
          slug: true,
          domain: true,
          domainAr: true,
          question: true,
          shortSummary: true,
          answerHtml: true,
          sourcesJson: true,
          orderIndex: true,
          bibleRefs: {
            select: {
              chapter: true,
              verseLabel: true,
              book: { select: { slug: true, nameAr: true } },
            },
          },
        },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      });
      return { data: { part, entries }, ttlMs: 1800_000 };
    }
    case 'explanations': {
      const articles = await prisma.explanationArticle.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          contentHtml: true,
          tags: true,
          authorName: true,
          sourceName: true,
          sourceUrl: true,
          viewsCount: true,
          category: { select: { name: true, slug: true, type: true } },
        },
        orderBy: { publishedAt: 'desc' },
      });
      return { data: { part, articles }, ttlMs: 3600_000 };
    }
    case 'commentaries-1':
      return { data: { part, items: await loadCommentariesRange(1, 12) }, ttlMs: 86_400_000 };
    case 'commentaries-2':
      return { data: { part, items: await loadCommentariesRange(13, 18) }, ttlMs: 86_400_000 };
    case 'commentaries-3':
      return { data: { part, items: await loadCommentariesRange(19, 19) }, ttlMs: 86_400_000 };
    case 'commentaries-4':
      return { data: { part, items: await loadCommentariesRange(20, 26) }, ttlMs: 86_400_000 };
    case 'commentaries-5':
      return { data: { part, items: await loadCommentariesRange(27, 45) }, ttlMs: 86_400_000 };
    case 'commentaries-6':
      return { data: { part, items: await loadCommentariesRange(46, 80) }, ttlMs: 86_400_000 };
    case 'synaxarium': {
      const entries = await prisma.synaxariumEntry.findMany({
        select: {
          id: true,
          slug: true,
          copticMonth: true,
          copticDay: true,
          monthNameAr: true,
          entryOrder: true,
          saintTitle: true,
          summary: true,
          contentHtml: true,
        },
        orderBy: [{ copticMonth: 'asc' }, { copticDay: 'asc' }, { entryOrder: 'asc' }],
      });
      return { data: { part, entries }, ttlMs: 86_400_000 };
    }
  }
}

async function getCachedBundle(part: OfflinePart): Promise<CachedBundleEntry> {
  const existing = bundleStore.entries.get(part);
  if (existing && existing.expiresAt > Date.now()) {
    return existing;
  }

  const running = bundleStore.inflight.get(part);
  if (running) return running;

  const task = (async () => {
    try {
      const { data, ttlMs } = await computePartPayload(part);
      const jsonBytes = Buffer.from(JSON.stringify(data), 'utf8');
      const entry: CachedBundleEntry = {
        jsonBytes,
        expiresAt: Date.now() + ttlMs,
      };
      bundleStore.entries.set(part, entry);
      return entry;
    } finally {
      bundleStore.inflight.delete(part);
    }
  })();

  bundleStore.inflight.set(part, task);
  return task;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const part = (searchParams.get('part') || 'core') as OfflinePart;

  if (!OFFLINE_PARTS.includes(part)) {
    return Response.json({ error: 'قسم البيانات غير صالح', parts: OFFLINE_PARTS }, { status: 400 });
  }

  const entry = await getCachedBundle(part);

  return new Response(entry.jsonBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
