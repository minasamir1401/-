import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic, safeDecodeSlug } from '../arabic';
import { publicSermonsWhere } from '../constants';
import { RouteError } from '../route-error';

const SERMON_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  mediaType: true,
  mediaUrl: true,
  durationSeconds: true,
  playsCount: true,
  sourceName: true,
  sourceUrl: true,
  series: { select: { id: true, title: true, slug: true } },
  preacher: { select: { id: true, name: true, slug: true } },
} as const;

export const getPreachersAndTopics = unstable_cache(
  async () => {
    const [preachers, topics] = await Promise.all([
      prisma.preacher.findMany({
        where: { sermons: { some: publicSermonsWhere } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { sermons: { where: publicSermonsWhere } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.sermonSeries.findMany({
        where: { sermons: { some: publicSermonsWhere } },
        select: { slug: true, title: true },
        orderBy: { title: 'asc' },
      }),
    ]);
    return { preachers, topics };
  },
  ['orthodox-sermons-preachers'],
  { revalidate: 600 },
);

export async function getPreacherProfile(rawSlug: string) {
  const preacher = await prisma.preacher.findUnique({
    where: { slug: safeDecodeSlug(rawSlug) },
    select: { id: true, name: true, slug: true, bio: true },
  });
  if (!preacher) throw new RouteError(404, 'الواعظ غير موجود');

  const sermons = await prisma.sermon.findMany({
    where: { ...publicSermonsWhere, preacherId: preacher.id },
    select: SERMON_CARD_SELECT,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
  });
  return { preacher, sermons };
}

export async function listSermons(params: {
  q?: string;
  preacher?: string;
  topic?: string;
  page?: string;
  pageSize?: string;
}) {
  const { q = '', preacher, topic, page = '1', pageSize = '18' } = params;
  const requestedPage = Math.max(parseInt(page, 10) || 1, 1);
  const take = Math.min(Math.max(parseInt(pageSize, 10) || 18, 1), 60);
  const normalized = normalizeArabic(typeof q === 'string' ? q.slice(0, 120) : '');

  const where: Prisma.SermonWhereInput = {
    ...publicSermonsWhere,
    ...(normalized
      ? { AND: normalized.split(/\s+/).map((word) => ({ textNormalized: { contains: word } })) }
      : {}),
    ...(typeof preacher === 'string' && preacher ? { preacher: { slug: preacher } } : {}),
    ...(typeof topic === 'string' && topic ? { series: { slug: topic } } : {}),
  };

  const [total, officialCount] = await Promise.all([
    prisma.sermon.count({ where }),
    prisma.sermon.count({ where: { AND: [where, { seriesId: { not: null } }] } }),
  ]);

  const totalPages = Math.max(Math.ceil(total / take), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * take;
  const officialTake = Math.max(0, Math.min(take, officialCount - offset));

  const getItems = (official: boolean, skip: number, limit: number) =>
    limit > 0
      ? prisma.sermon.findMany({
          where: { AND: [where, { seriesId: official ? { not: null } : null }] },
          select: SERMON_CARD_SELECT,
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit,
        })
      : Promise.resolve([]);

  const [official, archive] = await Promise.all([
    getItems(true, offset, officialTake),
    getItems(false, Math.max(0, offset - officialCount), take - officialTake),
  ]);

  return {
    items: [...official, ...archive],
    total,
    page: currentPage,
    totalPages,
  };
}

export async function recordSermonPlay(rawSlug: string) {
  const decodedSlug = safeDecodeSlug(rawSlug);
  const updated = await prisma.sermon
    .update({
      where: { slug: decodedSlug, AND: [publicSermonsWhere] },
      data: { playsCount: { increment: 1 } },
      select: { id: true, playsCount: true },
    })
    .catch(() => null);

  if (!updated) throw new RouteError(404, 'العظة غير موجودة');
  return updated;
}
