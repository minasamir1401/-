import { BookStatus } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic } from '../arabic';
import { publicSermonsWhere } from '../constants';

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok', timestamp: new Date().toISOString() };
}

export const getPortalStats = unstable_cache(
  async () => {
    const [
      bibleBooks,
      verses,
      books,
      articles,
      commentaries,
      sermons,
      apologeticsCount,
      synaxariumCount,
      commentedBookRows,
    ] = await Promise.all([
      prisma.bibleBook.count(),
      prisma.bibleVerse.count(),
      prisma.book.count({ where: { status: BookStatus.PUBLISHED } }),
      prisma.explanationArticle.count(),
      prisma.bibleCommentary.count(),
      prisma.sermon.count({ where: publicSermonsWhere }),
      prisma.apologeticsEntry.count(),
      prisma.synaxariumEntry.groupBy({ by: ['copticMonth', 'copticDay'] }),
      prisma.bibleCommentary.groupBy({ by: ['bookId'] }),
    ]);

    return {
      bibleBooks,
      verses,
      books,
      articles,
      commentaries,
      sermons,
      apologeticsCount,
      synaxariumDaysCount: synaxariumCount.length,
      commentedBooksCount: commentedBookRows.length,
    };
  },
  ['orthodox-portal-stats'],
  { revalidate: 120 },
);

export async function searchPortal(q = '') {
  const normalized = normalizeArabic(q);

  if (normalized.length < 2) {
    return {
      query: q,
      verses: [],
      books: [],
      articles: [],
      sermons: [],
      apologetics: [],
      synaxarium: [],
    };
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  const [verses, books, articles, sermons, apologetics, synaxarium] = await Promise.all([
    prisma.bibleVerse.findMany({
      where: { textNormalized: { contains: normalized } },
      select: {
        id: true,
        chapter: true,
        verseNumber: true,
        textTashkeel: true,
        book: { select: { slug: true, nameAr: true } },
      },
      take: 8,
    }),
    prisma.book.findMany({
      where: { status: BookStatus.PUBLISHED, textNormalized: { contains: normalized } },
      select: {
        id: true,
        slug: true,
        title: true,
        fileSizeBytes: true,
        author: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
      take: 8,
    }),
    prisma.explanationArticle.findMany({
      where: { textNormalized: { contains: normalized } },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: { select: { name: true, slug: true } },
      },
      take: 8,
    }),
    prisma.sermon.findMany({
      where: {
        ...publicSermonsWhere,
        AND: words.map((word) => ({ textNormalized: { contains: word } })),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        mediaUrl: true,
        preacher: { select: { name: true, slug: true } },
      },
      take: 8,
    }),
    prisma.apologeticsEntry.findMany({
      where: { AND: words.map((word) => ({ normalizedIndex: { contains: word } })) },
      select: {
        id: true,
        slug: true,
        domain: true,
        domainAr: true,
        question: true,
        shortSummary: true,
        bibleRefs: {
          select: {
            chapter: true,
            verseLabel: true,
            book: { select: { slug: true, nameAr: true } },
          },
          take: 3,
        },
      },
      orderBy: { orderIndex: 'asc' },
      take: 8,
    }),
    prisma.synaxariumEntry.findMany({
      where: { AND: words.map((word) => ({ normalizedIndex: { contains: word } })) },
      select: {
        id: true,
        slug: true,
        copticMonth: true,
        copticDay: true,
        monthNameAr: true,
        saintTitle: true,
        summary: true,
      },
      orderBy: [{ copticMonth: 'asc' }, { copticDay: 'asc' }],
      take: 8,
    }),
  ]);

  return {
    query: q,
    verses,
    books: books.map((b) => ({
      ...b,
      fileSizeBytes: b.fileSizeBytes !== null ? Number(b.fileSizeBytes) : null,
    })),
    articles,
    sermons,
    apologetics,
    synaxarium,
  };
}
