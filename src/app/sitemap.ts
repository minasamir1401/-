import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { BookFormat, BookStatus } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { absoluteUrl, resolveRuntimeOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/bible', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/commentaries', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/apologetics', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/catechism', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/explanations', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/library', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/sermons', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/videos', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/liturgy', changeFrequency: 'daily', priority: 0.9 },
  { path: '/synaxarium', changeFrequency: 'daily', priority: 0.85 },
  { path: '/ai', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/ask', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
];

const getCachedSitemapEntries = unstable_cache(
  async () => {
    const [bibleBooks, apologetics, books, explanations, authors, preachers] = await Promise.all([
      prisma.bibleBook.findMany({
        select: { slug: true, chaptersCount: true },
        orderBy: { orderIndex: 'asc' },
      }),
      prisma.apologeticsEntry.findMany({
        select: { slug: true, createdAt: true },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      }),
      prisma.book.findMany({
        where: { status: BookStatus.PUBLISHED },
        select: { slug: true, format: true, updatedAt: true },
        orderBy: { id: 'asc' },
      }),
      prisma.explanationArticle.findMany({
        select: { slug: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.author.findMany({
        where: { books: { some: { status: BookStatus.PUBLISHED } } },
        select: { slug: true },
      }),
      prisma.preacher.findMany({
        where: { sermons: { some: {} } },
        select: { slug: true },
      }),
    ]);

    return {
      bibleBooks,
      apologetics: apologetics.map((item) => ({
        slug: item.slug,
        lastModified: item.createdAt.toISOString(),
      })),
      books: books.map((item) => ({
        slug: item.slug,
        isHtml: item.format === BookFormat.HTML_CHAPTERS,
        lastModified: item.updatedAt.toISOString(),
      })),
      explanations: explanations.map((item) => ({
        slug: item.slug,
        lastModified: item.publishedAt.toISOString(),
      })),
      authors,
      preachers,
    };
  },
  ['orthodox-portal-sitemap-v1'],
  { revalidate: 3600 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await resolveRuntimeOrigin();
  const now = new Date();
  const data = await getCachedSitemapEntries();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(origin, route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  for (const book of data.bibleBooks) {
    const encodedSlug = encodeURIComponent(book.slug);
    for (let ch = 1; ch <= book.chaptersCount; ch++) {
      entries.push({
        url: absoluteUrl(origin, `/bible/${encodedSlug}/${ch}`),
        changeFrequency: 'yearly',
        priority: ch === 1 ? 0.8 : 0.65,
      });
    }
  }

  for (const item of data.apologetics) {
    entries.push({
      url: absoluteUrl(origin, `/apologetics/${encodeURIComponent(item.slug)}`),
      lastModified: new Date(item.lastModified),
      changeFrequency: 'monthly',
      priority: 0.85,
    });
  }

  for (const item of data.books) {
    const encoded = encodeURIComponent(item.slug);
    entries.push({
      url: absoluteUrl(origin, `/library/${encoded}`),
      lastModified: new Date(item.lastModified),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
    if (item.isHtml) {
      entries.push({
        url: absoluteUrl(origin, `/library/${encoded}/read`),
        lastModified: new Date(item.lastModified),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  for (const item of data.explanations) {
    entries.push({
      url: absoluteUrl(origin, `/explanations/${encodeURIComponent(item.slug)}`),
      lastModified: new Date(item.lastModified),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  for (const author of data.authors) {
    entries.push({
      url: absoluteUrl(origin, `/authors/${encodeURIComponent(author.slug)}`),
      changeFrequency: 'monthly',
      priority: 0.65,
    });
  }

  for (const preacher of data.preachers) {
    entries.push({
      url: absoluteUrl(origin, `/preachers/${encodeURIComponent(preacher.slug)}`),
      changeFrequency: 'monthly',
      priority: 0.65,
    });
  }

  return entries;
}
