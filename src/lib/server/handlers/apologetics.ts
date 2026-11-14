import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic, safeDecodeSlug } from '../arabic';
import { APOLOGETICS_DOMAINS } from '../constants';
import { RouteError } from '../route-error';

const getCachedApologeticsDomains = unstable_cache(
  async () => {
    const groupCounts = await prisma.apologeticsEntry.groupBy({
      by: ['domain'],
      _count: { _all: true },
    });
    const countMap = new Map(groupCounts.map((g) => [g.domain, g._count._all]));
    const totalAll = groupCounts.reduce((acc, g) => acc + g._count._all, 0);

    return APOLOGETICS_DOMAINS.map((d) => ({
      ...d,
      count: d.key === 'all' ? totalAll : countMap.get(d.key) || 0,
    }));
  },
  ['orthodox-apologetics-domains'],
  { revalidate: 600 },
);

export async function listApologetics(params: {
  domain?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const { domain, q = '', page, pageSize } = params;
  const normalized = normalizeArabic(q);

  const where: Prisma.ApologeticsEntryWhereInput = {
    ...(domain && domain !== 'all' ? { domain } : {}),
    ...(normalized
      ? {
          AND: normalized
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => ({ normalizedIndex: { contains: word } })),
        }
      : {}),
  };

  const totalFiltered = await prisma.apologeticsEntry.count({ where });
  const hasPagination = Boolean(page || pageSize);
  const take = hasPagination
    ? Math.min(Math.max(parseInt(pageSize || '24', 10) || 24, 1), 100)
    : Math.max(totalFiltered, 1);
  const totalPages = Math.max(Math.ceil(totalFiltered / take), 1);
  const currentPage = hasPagination
    ? Math.min(Math.max(parseInt(page || '1', 10) || 1, 1), totalPages)
    : 1;

  const [items, domains] = await Promise.all([
    prisma.apologeticsEntry.findMany({
      where,
      select: {
        id: true,
        slug: true,
        domain: true,
        domainAr: true,
        question: true,
        shortSummary: true,
        bibleRefs: {
          select: {
            id: true,
            chapter: true,
            verseLabel: true,
            book: { select: { id: true, slug: true, nameAr: true } },
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      ...(hasPagination ? { skip: (currentPage - 1) * take, take } : {}),
    }),
    getCachedApologeticsDomains(),
  ]);

  return {
    domains,
    total: totalFiltered,
    page: currentPage,
    pageSize: take,
    totalPages,
    items,
  };
}

export async function getApologeticsByBible(rawBookSlug: string, rawChapter: string) {
  const chNum = Number(rawChapter);
  if (!/^\d+$/.test(rawChapter) || !Number.isSafeInteger(chNum) || chNum < 1) {
    throw new RouteError(400, 'رقم الأصحاح غير صالح');
  }

  const bookSlug = safeDecodeSlug(rawBookSlug);
  const refs = await prisma.apologeticsBibleRef.findMany({
    where: {
      chapter: chNum,
      book: { slug: bookSlug },
    },
    select: {
      verseLabel: true,
      entry: {
        select: {
          id: true,
          slug: true,
          domain: true,
          domainAr: true,
          question: true,
          shortSummary: true,
        },
      },
    },
    orderBy: { entry: { orderIndex: 'asc' } },
  });

  const uniqueBySlug = new Map<string, (typeof refs)[number]>();
  for (const ref of refs) {
    if (!uniqueBySlug.has(ref.entry.slug)) {
      uniqueBySlug.set(ref.entry.slug, ref);
    }
  }

  return {
    bookSlug,
    chapter: chNum,
    items: Array.from(uniqueBySlug.values()).map((r) => ({
      ...r.entry,
      verseLabel: r.verseLabel,
    })),
  };
}

export async function getApologeticsDetail(rawSlug: string) {
  const decoded = safeDecodeSlug(rawSlug);

  const entry = await prisma.apologeticsEntry.findUnique({
    where: { slug: decoded },
    select: {
      id: true,
      slug: true,
      domain: true,
      domainAr: true,
      question: true,
      shortSummary: true,
      answerHtml: true,
      relatedBookSlugs: true,
      relatedArticleSlugs: true,
      sourcesJson: true,
      bibleRefs: {
        select: {
          id: true,
          chapter: true,
          verseLabel: true,
          book: { select: { id: true, slug: true, nameAr: true } },
        },
      },
    },
  });

  if (!entry) {
    throw new RouteError(404, 'الشبهة أو الموضوع غير موجود');
  }

  const bookSlugs = Array.isArray(entry.relatedBookSlugs)
    ? entry.relatedBookSlugs.filter((x): x is string => typeof x === 'string')
    : [];
  const articleSlugs = Array.isArray(entry.relatedArticleSlugs)
    ? entry.relatedArticleSlugs.filter((x): x is string => typeof x === 'string')
    : [];

  const [relatedBooks, relatedArticles, siblingEntries] = await Promise.all([
    bookSlugs.length > 0
      ? prisma.book.findMany({
          where: { slug: { in: bookSlugs } },
          select: {
            id: true,
            slug: true,
            title: true,
            format: true,
            author: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
          },
        })
      : Promise.resolve([]),
    articleSlugs.length > 0
      ? prisma.explanationArticle.findMany({
          where: { slug: { in: articleSlugs } },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            category: { select: { name: true, slug: true } },
          },
        })
      : Promise.resolve([]),
    prisma.apologeticsEntry.findMany({
      where: { domain: entry.domain, slug: { not: entry.slug } },
      select: { slug: true, question: true, domainAr: true },
      orderBy: { orderIndex: 'asc' },
      take: 6,
    }),
  ]);

  return {
    entry,
    relatedBooks,
    relatedArticles,
    siblingEntries,
  };
}
