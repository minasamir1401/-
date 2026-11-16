import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { BookStatus } from '@prisma/client';
import { prisma } from './prisma';
import { getDailyLiturgy } from './liturgy-service';

export const OFFLINE_PARTS = [
  'core',
  'apologetics',
  'bible-1',
  'bible-2',
  'bible-3',
  'explanations',
  'synaxarium',
] as const;

export type OfflinePart = (typeof OFFLINE_PARTS)[number];

export interface CachedBundleEntry {
  jsonBytes: Buffer;
  gzipBytes: Buffer;
  expiresAt: number;
}

interface OfflineBundleStore {
  entries: Map<string, CachedBundleEntry>;
  inflight: Map<string, Promise<CachedBundleEntry>>;
  bibleBookLookup?: { expiresAt: number; map: Map<number, { slug: string; nameAr: string }> };
  warmupStarted?: boolean;
}

const CACHE_DIR = join(tmpdir(), 'orthodox-offline-v3');
const globalStore = globalThis as unknown as { __orthodoxOfflineBundleCacheV3?: OfflineBundleStore };
const bundleStore: OfflineBundleStore =
  globalStore.__orthodoxOfflineBundleCacheV3 ??
  (globalStore.__orthodoxOfflineBundleCacheV3 = {
    entries: new Map(),
    inflight: new Map(),
  });

function getPartTtlMs(part: OfflinePart): number {
  if (part === 'apologetics') return 1800_000;
  if (part === 'core' || part === 'explanations') return 3600_000;
  return 86_400_000;
}

function readDiskCache(part: OfflinePart): CachedBundleEntry | null {
  try {
    const file = join(CACHE_DIR, `${part}.json.gz`);
    if (!existsSync(file)) return null;
    const ttlMs = getPartTtlMs(part);
    const st = statSync(file);
    if (Date.now() - st.mtimeMs >= ttlMs) return null;
    const gzipBytes = readFileSync(file);
    const jsonBytes = gunzipSync(gzipBytes);
    return {
      jsonBytes,
      gzipBytes,
      expiresAt: st.mtimeMs + ttlMs,
    };
  } catch {
    return null;
  }
}

function writeDiskCache(part: OfflinePart, gzipBytes: Buffer): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    const target = join(CACHE_DIR, `${part}.json.gz`);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmp, gzipBytes);
    renameSync(tmp, target);
  } catch {
    // Disk cache is best-effort
  }
}

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

async function computePartPayload(part: OfflinePart): Promise<unknown> {
  switch (part) {
    case 'core':
      return buildCorePayload();
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
      return { part, entries };
    }
    case 'bible-1':
      return { part, chapters: await loadBibleRange(1, 22) };
    case 'bible-2':
      return { part, chapters: await loadBibleRange(23, 46) };
    case 'bible-3':
      return { part, chapters: await loadBibleRange(47, 80) };
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
      return { part, articles };
    }
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
      return { part, entries };
    }
  }
}

export async function getOfflineBundle(part: OfflinePart): Promise<CachedBundleEntry> {
  const mem = bundleStore.entries.get(part);
  if (mem && mem.expiresAt > Date.now()) {
    return mem;
  }

  const disk = readDiskCache(part);
  if (disk) {
    bundleStore.entries.set(part, disk);
    return disk;
  }

  const running = bundleStore.inflight.get(part);
  if (running) return running;

  const task = (async () => {
    try {
      const data = await computePartPayload(part);
      const jsonBytes = Buffer.from(JSON.stringify(data), 'utf8');
      const gzipBytes = gzipSync(jsonBytes, { level: 6 });
      const entry: CachedBundleEntry = {
        jsonBytes,
        gzipBytes,
        expiresAt: Date.now() + getPartTtlMs(part),
      };
      bundleStore.entries.set(part, entry);
      writeDiskCache(part, gzipBytes);
      return entry;
    } finally {
      bundleStore.inflight.delete(part);
    }
  })();

  bundleStore.inflight.set(part, task);
  return task;
}

export async function warmAllOfflineBundles(): Promise<void> {
  if (bundleStore.warmupStarted) return;
  bundleStore.warmupStarted = true;
  for (const part of OFFLINE_PARTS) {
    try {
      await getOfflineBundle(part);
    } catch {
      // Skip transient startup warm error; on-demand fetch will retry
    }
  }
}
