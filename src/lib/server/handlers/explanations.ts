import { ExplanationType, Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic, safeDecodeSlug } from '../arabic';
import { RouteError } from '../route-error';

export const getExplanationCategories = unstable_cache(
  async () => {
    const categories = await prisma.explanationCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        _count: { select: { articles: true } },
      },
      orderBy: { id: 'asc' },
    });
    return { categories };
  },
  ['orthodox-explanation-categories'],
  { revalidate: 600 },
);

export async function listExplanations(params: {
  q?: string;
  category?: string;
  type?: string;
  page?: string;
  pageSize?: string;
}) {
  const { q = '', category, type, page = '1', pageSize = '16' } = params;
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const take = Math.min(Math.max(parseInt(pageSize, 10) || 16, 1), 50);
  const skip = (currentPage - 1) * take;
  const normalized = normalizeArabic(q);

  const where: Prisma.ExplanationArticleWhereInput = {
    ...(normalized ? { textNormalized: { contains: normalized } } : {}),
    category: {
      ...(typeof category === 'string' && category ? { slug: category } : {}),
      ...(type && ['COMMENTARY', 'DOGMA', 'RITES', 'PATROLOGY', 'QA', 'SPIRITUAL'].includes(type)
        ? { type: type as ExplanationType }
        : {}),
    },
  };

  const [items, total] = await Promise.all([
    prisma.explanationArticle.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        authorName: true,
        sourceName: true,
        publishedAt: true,
        viewsCount: true,
        category: { select: { id: true, name: true, slug: true, type: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    }),
    prisma.explanationArticle.count({ where }),
  ]);

  return {
    items,
    total,
    page: currentPage,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

export async function getExplanationDetail(rawSlug: string) {
  const decodedSlug = safeDecodeSlug(rawSlug);

  const article = await prisma.explanationArticle.findUnique({
    where: { slug: decodedSlug },
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
      category: { select: { id: true, name: true, slug: true, type: true } },
    },
  });

  if (!article) {
    throw new RouteError(404, 'المقال غير موجود');
  }

  void prisma.explanationArticle
    .update({ where: { id: article.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});

  return { article };
}
