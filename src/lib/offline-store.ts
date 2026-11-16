'use client';

const DB_NAME = 'orthodox-beacon-offline-v1';
const DB_VERSION = 1;
export const BOOKS_PDF_CACHE_NAME = 'orthodox-books-pdf-v1';

const APP_SHELL_URLS = [
  '/',
  '/offline-reader',
  '/apologetics',
  '/bible',
  '/commentaries',
  '/catechism',
  '/explanations',
  '/synaxarium',
  '/liturgy',
  '/library',
  '/sermons',
  '/videos',
  '/about',
  '/ask',
  '/design/church.webp',
  '/design/sanctuary.webp',
  '/design/sections/ai.webp',
  '/design/sections/apologetics.webp',
  '/design/sections/ask.webp',
  '/design/sections/audio.webp',
  '/design/sections/beacon.webp',
  '/design/sections/bible.webp',
  '/design/sections/calendar.webp',
  '/design/sections/catechism.webp',
  '/design/sections/commentaries.webp',
  '/design/sections/explanations.webp',
  '/design/sections/library.webp',
  '/design/sections/liturgy.webp',
  '/design/sections/sermons.webp',
  '/design/sections/synaxarium.webp',
  '/design/sections/videos.webp',
  '/pdf.worker.min.mjs',
];

export type OfflineStageId =
  | 'apologetics'
  | 'bible_catechism'
  | 'explanations'
  | 'liturgy_synaxarium';

export interface OfflineStageDefinition {
  id: OfflineStageId;
  order: number;
  title: string;
  parts: readonly string[];
  pages: readonly string[];
}

export const OFFLINE_STAGES: readonly OfflineStageDefinition[] = [
  {
    id: 'apologetics',
    order: 1,
    title: 'الشبهات والردود',
    parts: ['core', 'apologetics'],
    pages: ['/', '/apologetics', '/offline-reader'],
  },
  {
    id: 'bible_catechism',
    order: 2,
    title: 'الكتاب المقدس والعقيدة',
    parts: ['bible-1', 'bible-2', 'bible-3'],
    pages: ['/bible', '/catechism'],
  },
  {
    id: 'explanations',
    order: 3,
    title: 'الشروحات والمقالات',
    parts: ['explanations'],
    pages: ['/explanations'],
  },
  {
    id: 'liturgy_synaxarium',
    order: 4,
    title: 'السنكسار والليتورجيا',
    parts: ['synaxarium'],
    pages: ['/synaxarium', '/liturgy', '/about', '/ask', '/library', '/sermons', '/videos'],
  },
];

export interface OfflineSyncMeta {
  syncedAt: string;
  totalBytes: number;
  isComplete?: boolean;
  counts: {
    bibleBooks: number;
    bibleChapters: number;
    apologetics: number;
    explanations: number;
    commentaries: number;
    synaxarium: number;
    booksCatalog: number;
    sermons: number;
  };
}

export interface OfflineSyncCheckpoint {
  status: 'running' | 'paused' | 'completed';
  completedParts: string[];
  completedStages: OfflineStageId[];
  currentStage: OfflineStageId | null;
  currentPart: string | null;
  failedReason?: string;
  updatedAt: string;
  totalBytes: number;
  counts: OfflineSyncMeta['counts'];
}

export interface OfflineSavedBook {
  slug: string;
  title: string;
  authorName: string;
  format: string;
  savedAt: string;
  bytes: number;
  chaptersCount?: number;
}

export interface OfflineBibleBook {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  testament: 'OLD' | 'DEUTEROCANON' | 'NEW';
  orderIndex: number;
  chaptersCount: number;
}

export interface OfflineBibleChapter {
  key: string;
  slug: string;
  chapter: number;
  verses: Array<[number, string]>;
}

export interface OfflineApologeticsEntry {
  id: number;
  slug: string;
  domain: string;
  domainAr: string;
  question: string;
  shortSummary: string;
  answerHtml: string;
  sourcesJson: Array<{ title: string; url: string }> | null;
  orderIndex: number;
  bibleRefs: Array<{
    chapter: number;
    verseLabel: string | null;
    book: { slug: string; nameAr: string };
  }>;
}

export interface OfflineExplanationArticle {
  id: number;
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  tags: string[];
  authorName: string | null;
  sourceName: string;
  sourceUrl: string;
  viewsCount: number;
  category: { name: string; slug: string; type: string };
}

export interface OfflineCommentaryItem {
  id: number;
  chapter: number;
  title: string;
  contentHtml: string;
  sourceName: string;
  sourceUrl: string;
  book: { slug: string; nameAr: string };
  author: { name: string };
}

export interface OfflineSynaxariumEntry {
  id: number;
  slug: string;
  copticMonth: number;
  copticDay: number;
  monthNameAr: string;
  entryOrder: number;
  saintTitle: string;
  summary: string | null;
  contentHtml: string;
}

export interface OfflineBookCatalogItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
  pageCount: number | null;
  fileSizeBytes: number | null;
  sourceSite: string;
  author: { name: string; slug: string };
  category: { name: string; slug: string };
  _count: { chapters: number };
}

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('bibleChapters')) db.createObjectStore('bibleChapters', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('apologetics')) db.createObjectStore('apologetics', { keyPath: 'slug' });
      if (!db.objectStoreNames.contains('explanations')) db.createObjectStore('explanations', { keyPath: 'slug' });
      if (!db.objectStoreNames.contains('commentaries')) db.createObjectStore('commentaries', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('savedBooks')) db.createObjectStore('savedBooks', { keyPath: 'slug' });
      if (!db.objectStoreNames.contains('savedBookChapters')) db.createObjectStore('savedBookChapters', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putBatch(db: IDBDatabase, storeName: string, records: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of records) store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getRecord<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function getAllRecords<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

function deleteRecord(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineSyncMeta(): Promise<OfflineSyncMeta | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: OfflineSyncMeta }>(db, 'kv', 'syncMeta');
    return row?.value ?? null;
  } finally {
    db.close();
  }
}

const CHECKPOINT_KV_KEY = 'syncCheckpointV2';

export async function getOfflineCheckpoint(): Promise<OfflineSyncCheckpoint | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: OfflineSyncCheckpoint }>(db, 'kv', CHECKPOINT_KV_KEY);
    return row?.value ?? null;
  } finally {
    db.close();
  }
}

function createEmptyCounts(): OfflineSyncMeta['counts'] {
  return {
    bibleBooks: 0,
    bibleChapters: 0,
    apologetics: 0,
    explanations: 0,
    commentaries: 0,
    synaxarium: 0,
    booksCatalog: 0,
    sermons: 0,
  };
}

async function collectNextChunksFromPages(pages: readonly string[]): Promise<string[]> {
  const discovered = new Set<string>(pages);
  await Promise.all(
    pages.map(async (pageUrl) => {
      try {
        const res = await fetch(pageUrl, { credentials: 'same-origin' });
        if (!res.ok) return;
        const html = await res.text();
        const matches = html.match(/\/_next\/static\/[^"'\s<>)]+/g) || [];
        for (const m of matches) discovered.add(m);
      } catch {
        // Ignore transient shell parse errors
      }
    }),
  );
  return Array.from(discovered);
}

async function cacheUrls(urls: readonly string[]): Promise<void> {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_APP_SHELL', urls: [...urls] });
    return;
  }
  if ('caches' in window) {
    const pageCache = await caches.open('orthodox-pages-v1');
    await Promise.allSettled(
      urls.filter((u) => !u.startsWith('/design/') && !u.endsWith('.mjs')).map((u) => pageCache.add(u)),
    );
  }
}

async function fetchBundlePartFast(
  partKey: string,
): Promise<{ data: Record<string, unknown>; wireBytes: number }> {
  const canStreamGz = typeof DecompressionStream !== 'undefined';
  const url = canStreamGz
    ? `/api/offline/bundle?part=${partKey}&fmt=gz`
    : `/api/offline/bundle?part=${partKey}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`تعذر تحميل الحزمة (${partKey})`);

  if (canStreamGz && res.headers.get('X-Payload-Compression') === 'gzip') {
    const compressedBuf = await res.arrayBuffer();
    const stream = new Blob([compressedBuf]).stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return { data: JSON.parse(text), wireBytes: compressedBuf.byteLength };
  }

  const rawText = await res.text();
  return { data: JSON.parse(rawText), wireBytes: rawText.length };
}

export async function syncFullSiteOffline(
  onProgress: (percent: number, label: string, checkpoint: OfflineSyncCheckpoint) => void,
  options?: { reset?: boolean },
): Promise<OfflineSyncMeta> {
  const db = await openOfflineDb();
  const totalPartsCount = OFFLINE_STAGES.reduce((acc, s) => acc + s.parts.length, 0);

  const existingCheckpoint = options?.reset
    ? null
    : await getRecord<{ key: string; value: OfflineSyncCheckpoint }>(db, 'kv', CHECKPOINT_KV_KEY).then(
        (r) => r?.value ?? null,
      );

  const validStageIds = new Set<OfflineStageId>(OFFLINE_STAGES.map((s) => s.id));
  const completedParts = new Set<string>(existingCheckpoint?.completedParts ?? []);
  const completedStages = new Set<OfflineStageId>(
    (existingCheckpoint?.completedStages ?? []).filter((id) => validStageIds.has(id)),
  );
  const counts: OfflineSyncMeta['counts'] = {
    ...createEmptyCounts(),
    ...(existingCheckpoint?.counts ?? {}),
  };
  let totalBytes = existingCheckpoint?.totalBytes ?? 0;

  let currentStage: OfflineStageId | null = null;
  let currentPart: string | null = null;

  const buildCheckpoint = (
    status: OfflineSyncCheckpoint['status'],
    failedReason?: string,
  ): OfflineSyncCheckpoint => ({
    status,
    completedParts: Array.from(completedParts),
    completedStages: Array.from(completedStages),
    currentStage,
    currentPart,
    ...(failedReason ? { failedReason } : {}),
    updatedAt: new Date().toISOString(),
    totalBytes,
    counts: { ...counts },
  });

  const persistCheckpointAndPartialMeta = async (
    status: OfflineSyncCheckpoint['status'],
    failedReason?: string,
  ) => {
    const cp = buildCheckpoint(status, failedReason);
    const meta: OfflineSyncMeta = {
      syncedAt: cp.updatedAt,
      totalBytes: cp.totalBytes,
      isComplete: status === 'completed',
      counts: cp.counts,
    };
    await putBatch(db, 'kv', [
      { key: CHECKPOINT_KV_KEY, value: cp },
      { key: 'syncMeta', value: meta },
    ]);
    return { cp, meta };
  };

  async function savePartPayload(partKey: string, data: Record<string, unknown>, wireBytes: number) {
    totalBytes += wireBytes;

    if (partKey === 'core') {
      const bibleBooks = (data.bibleBooks as unknown[]) || [];
      const books = (data.books as unknown[]) || [];
      const sermons = (data.sermons as unknown[]) || [];
      counts.bibleBooks = bibleBooks.length;
      counts.booksCatalog = books.length;
      counts.sermons = sermons.length;
      await putBatch(db, 'kv', [{ key: 'coreData', value: data }]);
    } else if (partKey === 'apologetics') {
      const entries = (data.entries as OfflineApologeticsEntry[]) || [];
      counts.apologetics = entries.length;
      const summaryIndex = entries.map((e) => ({
        id: e.id,
        slug: e.slug,
        domain: e.domain,
        domainAr: e.domainAr,
        question: e.question,
        shortSummary: e.shortSummary,
        bibleRefs: e.bibleRefs,
      }));
      await putBatch(db, 'apologetics', entries);
      await putBatch(db, 'kv', [{ key: 'apologeticsList', value: summaryIndex }]);
    } else if (partKey.startsWith('bible-')) {
      const chapters =
        (data.chapters as Array<{ slug: string; chapter: number; verses: Array<[number, string]> }>) || [];
      const rows = chapters.map((c) => ({
        key: `${c.slug}:${c.chapter}`,
        slug: c.slug,
        chapter: c.chapter,
        verses: c.verses,
      }));
      counts.bibleChapters += rows.length;
      await putBatch(db, 'bibleChapters', rows);
    } else if (partKey.startsWith('commentaries-')) {
      const items = (data.items as OfflineCommentaryItem[]) || [];
      counts.commentaries += items.length;
      const buckets = new Map<string, OfflineCommentaryItem[]>();
      for (const item of items) {
        const key = `${item.book.slug}:${item.chapter}`;
        let arr = buckets.get(key);
        if (!arr) {
          arr = [];
          buckets.set(key, arr);
        }
        arr.push(item);
      }
      const records = Array.from(buckets.entries()).map(([key, chunkItems]) => ({
        key,
        items: chunkItems,
      }));
      await putBatch(db, 'commentaries', records);
    } else if (partKey === 'explanations') {
      const articles = (data.articles as OfflineExplanationArticle[]) || [];
      counts.explanations = articles.length;
      const summaryIndex = articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        authorName: a.authorName,
        sourceName: a.sourceName,
        category: a.category,
      }));
      await putBatch(db, 'explanations', articles);
      await putBatch(db, 'kv', [{ key: 'explanationsList', value: summaryIndex }]);
    } else if (partKey === 'synaxarium') {
      const entries = (data.entries as OfflineSynaxariumEntry[]) || [];
      counts.synaxarium = entries.length;
      await putBatch(db, 'kv', [{ key: 'synaxariumList', value: entries }]);
    }

    completedParts.add(partKey);
  }

  try {
    for (const stage of OFFLINE_STAGES) {
      if (completedStages.has(stage.id) && stage.parts.every((p) => completedParts.has(p))) {
        continue;
      }

      currentStage = stage.id;
      const pendingParts = stage.parts.filter((p) => !completedParts.has(p));

      if (pendingParts.length > 0) {
        const initialPct = Math.round((completedParts.size / totalPartsCount) * 95);
        const startLabel = `المرحلة ${stage.order} من 4: جاري تحميل ${stage.title}...`;
        const { cp } = await persistCheckpointAndPartialMeta('running');
        onProgress(initialPct, startLabel, cp);

        let cursor = 0;
        const concurrency = stage.id === 'bible_catechism' ? 3 : Math.min(2, pendingParts.length);
        let saveChain = Promise.resolve();

        const runWorker = async () => {
          while (cursor < pendingParts.length) {
            const partKey = pendingParts[cursor++];
            currentPart = partKey;
            const { data, wireBytes } = await fetchBundlePartFast(partKey);

            // Serialize IndexedDB state mutations so concurrent workers never drop checkpoint updates
            saveChain = saveChain.then(async () => {
              await savePartPayload(partKey, data, wireBytes);
              const { cp: updatedCp } = await persistCheckpointAndPartialMeta('running');
              const pct = Math.min(95, Math.round((completedParts.size / totalPartsCount) * 95));
              onProgress(pct, `المرحلة ${stage.order}: ${stage.title} (${completedParts.size}/${totalPartsCount})`, updatedCp);
            });
            await saveChain;
          }
        };

        await Promise.all(Array.from({ length: concurrency }, runWorker));
      }

      if (stage.pages.length > 0) {
        const urls = await collectNextChunksFromPages(stage.pages);
        await cacheUrls(urls);
      }

      completedStages.add(stage.id);
      currentPart = null;
      const { cp: stageDoneCp } = await persistCheckpointAndPartialMeta('running');
      const stagePct = Math.min(96, Math.round((completedParts.size / totalPartsCount) * 95));
      onProgress(stagePct, `اكتملت المرحلة ${stage.order}: ${stage.title}`, stageDoneCp);
    }

    onProgress(98, 'جاري تثبيت الأصول والملفات الثابتة (دون الكتب)...', buildCheckpoint('running'));
    const extraStatic = APP_SHELL_URLS.filter((u) => !u.startsWith('/library/'));
    await cacheUrls(extraStatic);

    currentStage = null;
    currentPart = null;
    const { cp: finalCp, meta: finalMeta } = await persistCheckpointAndPartialMeta('completed');
    onProgress(100, 'تم حفظ كل المراحل للعمل أوفلاين بنجاح.', finalCp);
    return finalMeta;
  } catch (err) {
    const reason =
      !navigator.onLine
        ? 'انقطع الاتصال بالإنترنت — محفوظ حتى آخر نقطة'
        : err instanceof Error
          ? err.message
          : 'توقف التحميل مؤقتًا — يمكن الاستئناف من آخر نقطة';
    const { cp: pausedCp } = await persistCheckpointAndPartialMeta('paused', reason);
    const pct = Math.round((completedParts.size / totalPartsCount) * 95);
    onProgress(pct, reason, pausedCp);
    throw err;
  } finally {
    db.close();
  }
}

export async function clearAllSiteOffline(): Promise<void> {
  if (typeof indexedDB !== 'undefined') {
    const db = await openOfflineDb();
    try {
      for (const store of ['kv', 'bibleChapters', 'apologetics', 'explanations', 'commentaries']) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(store, 'readwrite');
          tx.objectStore(store).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
    } finally {
      db.close();
    }
  }
  if ('caches' in window) {
    await Promise.all([
      caches.delete('orthodox-pages-v1'),
      caches.delete('orthodox-api-v1'),
    ]);
  }
}

export async function saveBookOffline(book: {
  slug: string;
  title: string;
  authorName: string;
  format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
  chapters?: Array<{ chapterNumber: number; title: string }>;
}): Promise<OfflineSavedBook> {
  const db = await openOfflineDb();
  try {
    let totalBytes = 0;

    if (book.format === 'HTML_CHAPTERS' && book.chapters?.length) {
      const records: Array<{ key: string; slug: string; chapterNumber: number; title: string; contentHtml: string }> = [];
      for (const ch of book.chapters) {
        const res = await fetch(`/library/${encodeURIComponent(book.slug)}/file/${ch.chapterNumber}`);
        if (!res.ok) continue;
        const json = await res.json();
        const contentHtml = json?.chapter?.contentHtml || '';
        totalBytes += contentHtml.length;
        records.push({
          key: `${book.slug}:${ch.chapterNumber}`,
          slug: book.slug,
          chapterNumber: ch.chapterNumber,
          title: json?.chapter?.title || ch.title,
          contentHtml,
        });
      }
      await putBatch(db, 'savedBookChapters', records);
    } else {
      const streamUrl = `/library/${encodeURIComponent(book.slug)}/file/stream`;
      const res = await fetch(streamUrl);
      if (!res.ok) throw new Error('تعذر تحميل ملف الكتاب حالياً');
      const blob = await res.blob();
      totalBytes = blob.size;
      if (totalBytes < 1024) throw new Error('ملف الكتاب غير مكتمل');
      const cache = await caches.open(BOOKS_PDF_CACHE_NAME);
      await cache.put(
        `${window.location.origin}${streamUrl}`,
        new Response(blob, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': String(totalBytes),
            'Accept-Ranges': 'bytes',
          },
        }),
      );
    }

    const saved: OfflineSavedBook = {
      slug: book.slug,
      title: book.title,
      authorName: book.authorName,
      format: book.format,
      savedAt: new Date().toISOString(),
      bytes: totalBytes,
      chaptersCount: book.chapters?.length,
    };
    await putBatch(db, 'savedBooks', [saved]);
    return saved;
  } finally {
    db.close();
  }
}

export async function removeSavedBookOffline(slug: string): Promise<void> {
  const db = await openOfflineDb();
  try {
    await deleteRecord(db, 'savedBooks', slug);
    const chapters = await getAllRecords<{ key: string; slug: string }>(db, 'savedBookChapters');
    for (const c of chapters) {
      if (c.slug === slug) await deleteRecord(db, 'savedBookChapters', c.key);
    }
  } finally {
    db.close();
  }
  if ('caches' in window) {
    const cache = await caches.open(BOOKS_PDF_CACHE_NAME);
    const streamUrl = `${window.location.origin}/library/${encodeURIComponent(slug)}/file/stream`;
    await cache.delete(streamUrl);
  }
}

export async function getSavedBookOffline(slug: string): Promise<OfflineSavedBook | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openOfflineDb();
  try {
    return await getRecord<OfflineSavedBook>(db, 'savedBooks', slug);
  } finally {
    db.close();
  }
}

export async function listSavedBooksOffline(): Promise<OfflineSavedBook[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openOfflineDb();
  try {
    return await getAllRecords<OfflineSavedBook>(db, 'savedBooks');
  } finally {
    db.close();
  }
}

export async function readOfflineCore(): Promise<{
  bibleBooks: OfflineBibleBook[];
  books: OfflineBookCatalogItem[];
  authors: Array<{ id: number; name: string; slug: string; bio: string | null }>;
  preachers: Array<{ id: number; name: string; slug: string; bio: string | null }>;
  sermons: Array<{ id: number; slug: string; title: string; durationSeconds: number | null; mediaUrl: string; preacher: { name: string; slug: string } }>;
} | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: any }>(db, 'kv', 'coreData');
    return row?.value ?? null;
  } finally {
    db.close();
  }
}

export async function readOfflineBibleChapter(slug: string, chapter: number) {
  const db = await openOfflineDb();
  try {
    const [coreRow, chapRow, commRow] = await Promise.all([
      getRecord<{ key: string; value: { bibleBooks: OfflineBibleBook[] } }>(db, 'kv', 'coreData'),
      getRecord<OfflineBibleChapter>(db, 'bibleChapters', `${slug}:${chapter}`),
      getRecord<{ key: string; items: OfflineCommentaryItem[] }>(db, 'commentaries', `${slug}:${chapter}`),
    ]);
    const book = coreRow?.value?.bibleBooks?.find((b) => b.slug === slug) || null;
    if (!book || !chapRow) return null;
    return { book, chapter, verses: chapRow.verses, commentaries: commRow?.items || [] };
  } finally {
    db.close();
  }
}

export async function readOfflineApologetic(slug: string): Promise<OfflineApologeticsEntry | null> {
  const db = await openOfflineDb();
  try {
    return await getRecord<OfflineApologeticsEntry>(db, 'apologetics', slug);
  } finally {
    db.close();
  }
}

export async function readOfflineApologeticsList(): Promise<Array<Omit<OfflineApologeticsEntry, 'answerHtml' | 'sourcesJson' | 'orderIndex'>>> {
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: any[] }>(db, 'kv', 'apologeticsList');
    return row?.value || [];
  } finally {
    db.close();
  }
}

export async function readOfflineExplanation(slug: string): Promise<OfflineExplanationArticle | null> {
  const db = await openOfflineDb();
  try {
    return await getRecord<OfflineExplanationArticle>(db, 'explanations', slug);
  } finally {
    db.close();
  }
}

export async function readOfflineExplanationsList(): Promise<Array<Omit<OfflineExplanationArticle, 'contentHtml' | 'tags' | 'sourceUrl' | 'viewsCount'>>> {
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: any[] }>(db, 'kv', 'explanationsList');
    return row?.value || [];
  } finally {
    db.close();
  }
}

export async function readOfflineSynaxarium(): Promise<OfflineSynaxariumEntry[]> {
  const db = await openOfflineDb();
  try {
    const row = await getRecord<{ key: string; value: OfflineSynaxariumEntry[] }>(db, 'kv', 'synaxariumList');
    return row?.value || [];
  } finally {
    db.close();
  }
}

export async function readOfflineSavedBookChapters(slug: string) {
  const db = await openOfflineDb();
  try {
    const all = await getAllRecords<{ key: string; slug: string; chapterNumber: number; title: string; contentHtml: string }>(
      db,
      'savedBookChapters',
    );
    return all.filter((c) => c.slug === slug).sort((a, b) => a.chapterNumber - b.chapterNumber);
  } finally {
    db.close();
  }
}
