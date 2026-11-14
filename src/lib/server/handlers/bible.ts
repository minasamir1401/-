import { Prisma, Testament } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic, safeDecodeSlug } from '../arabic';
import { formatBibleCommentary } from '../text-formatters';
import { RouteError } from '../route-error';

const getCachedBibleBooks = unstable_cache(
  async (testamentKey: string) => {
    const where = ['OLD', 'DEUTEROCANON', 'NEW'].includes(testamentKey)
      ? { testament: testamentKey as Testament }
      : undefined;

    const books = await prisma.bibleBook.findMany({
      where,
      select: {
        id: true,
        slug: true,
        osisCode: true,
        nameAr: true,
        nameEn: true,
        testament: true,
        orderIndex: true,
        chaptersCount: true,
        _count: { select: { commentaries: true, apologeticsRefs: true } },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return { books };
  },
  ['orthodox-bible-books'],
  { revalidate: 3600 },
);

export async function getBibleBooks(testament?: string) {
  return getCachedBibleBooks(testament || 'ALL');
}

export async function getBibleChapter(rawSlug: string, rawChapter: string) {
  const chNum = Number(rawChapter);
  if (!/^\d+$/.test(rawChapter) || !Number.isSafeInteger(chNum) || chNum < 1) {
    throw new RouteError(400, 'رقم الأصحاح غير صالح');
  }

  const slug = safeDecodeSlug(rawSlug);
  const book = await prisma.bibleBook.findUnique({ where: { slug } });
  if (!book) {
    throw new RouteError(404, 'السفر غير موجود');
  }
  if (chNum > book.chaptersCount) {
    throw new RouteError(404, 'الأصحاح غير موجود');
  }

  const [verses, commentaries, apologeticsRefs] = await Promise.all([
    prisma.bibleVerse.findMany({
      where: { bookId: book.id, chapter: chNum },
      select: { id: true, verseNumber: true, textTashkeel: true },
      orderBy: { verseNumber: 'asc' },
    }),
    prisma.bibleCommentary.findMany({
      where: { bookId: book.id, chapter: chNum },
      select: {
        id: true,
        chapter: true,
        title: true,
        contentHtml: true,
        sourceName: true,
        sourceUrl: true,
        author: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.apologeticsBibleRef.findMany({
      where: { bookId: book.id, chapter: chNum },
      select: {
        verseLabel: true,
        entry: {
          select: {
            slug: true,
            domain: true,
            domainAr: true,
            question: true,
            shortSummary: true,
          },
        },
      },
      orderBy: { entry: { orderIndex: 'asc' } },
    }),
  ]);

  const seenSlugs = new Set<string>();
  const apologetics = apologeticsRefs
    .filter((r) => {
      if (seenSlugs.has(r.entry.slug)) return false;
      seenSlugs.add(r.entry.slug);
      return true;
    })
    .map((r) => ({ ...r.entry, verseLabel: r.verseLabel }));

  return {
    book,
    chapter: chNum,
    verses,
    commentaries: commentaries.map((item) => ({
      ...item,
      contentHtml: formatBibleCommentary(item.contentHtml),
    })),
    apologetics,
  };
}

export async function searchBible(params: { q?: string; testament?: string; limit?: string }) {
  const q = params.q || '';
  const normalized = normalizeArabic(q);
  if (normalized.length < 2) {
    return { query: q, results: [] };
  }

  const take = Math.min(Math.max(parseInt(params.limit || '40', 10) || 40, 1), 100);
  const results = await prisma.bibleVerse.findMany({
    where: {
      textNormalized: { contains: normalized },
      ...(params.testament && ['OLD', 'DEUTEROCANON', 'NEW'].includes(params.testament)
        ? { book: { testament: params.testament as Testament } }
        : {}),
    },
    select: {
      id: true,
      chapter: true,
      verseNumber: true,
      textTashkeel: true,
      book: {
        select: { id: true, slug: true, nameAr: true, testament: true },
      },
    },
    take,
    orderBy: [{ book: { orderIndex: 'asc' } }, { chapter: 'asc' }, { verseNumber: 'asc' }],
  });

  return { query: q, normalized, results };
}

export async function getCommentaries(params: {
  bookSlug?: string;
  authorSlug?: string;
  page?: string;
  pageSize?: string;
}) {
  const currentPage = Math.max(parseInt(params.page || '1', 10) || 1, 1);
  const take = Math.min(Math.max(parseInt(params.pageSize || '24', 10) || 24, 1), 60);
  const skip = (currentPage - 1) * take;

  const where: Prisma.BibleCommentaryWhereInput = {
    ...(params.bookSlug ? { book: { slug: params.bookSlug } } : {}),
    ...(params.authorSlug ? { author: { slug: params.authorSlug } } : {}),
  };

  const [items, total, authors] = await Promise.all([
    prisma.bibleCommentary.findMany({
      where,
      select: {
        id: true,
        chapter: true,
        title: true,
        contentHtml: true,
        sourceName: true,
        sourceUrl: true,
        author: { select: { id: true, name: true, slug: true } },
        book: { select: { id: true, slug: true, nameAr: true, testament: true } },
      },
      orderBy: [{ book: { orderIndex: 'asc' } }, { chapter: 'asc' }],
      skip,
      take,
    }),
    prisma.bibleCommentary.count({ where }),
    prisma.commentaryAuthor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { commentaries: true } },
      },
    }),
  ]);

  return {
    items: items.map((item) => ({ ...item, contentHtml: formatBibleCommentary(item.contentHtml) })),
    total,
    authors,
    page: currentPage,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

export const getCommentaryBooks = unstable_cache(
  async () => {
    const [books, authors, distinctPairs] = await Promise.all([
      prisma.bibleBook.findMany({
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          testament: true,
          chaptersCount: true,
          _count: { select: { commentaries: true, apologeticsRefs: true } },
        },
      }),
      prisma.commentaryAuthor.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { commentaries: true } },
        },
        orderBy: { commentaries: { _count: 'desc' } },
      }),
      prisma.bibleCommentary.groupBy({
        by: ['bookId', 'authorId'],
      }),
    ]);

    const authorMap = new Map(authors.map((a) => [a.id, a]));
    const bookAuthorsMap = new Map<number, Array<{ id: number; name: string; slug: string }>>();
    for (const pair of distinctPairs) {
      const a = authorMap.get(pair.authorId);
      if (!a) continue;
      const list = bookAuthorsMap.get(pair.bookId) || [];
      if (!list.some((x) => x.id === a.id)) {
        list.push({ id: a.id, name: a.name, slug: a.slug });
      }
      bookAuthorsMap.set(pair.bookId, list);
    }

    return {
      books: books.map((b) => ({
        ...b,
        commentators: bookAuthorsMap.get(b.id) || [],
      })),
      authors,
    };
  },
  ['orthodox-commentary-books'],
  { revalidate: 3600 },
);
