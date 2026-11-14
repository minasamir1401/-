import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic } from '../arabic';
import { COPTIC_MONTHS, getCopticDateFromIso } from '../coptic-date';

const SYNAXARIUM_SELECT = {
  id: true,
  slug: true,
  copticMonth: true,
  copticDay: true,
  monthNameAr: true,
  entryOrder: true,
  saintTitle: true,
  summary: true,
  contentHtml: true,
  sourceUrl: true,
} as const;

const getCachedSynaxariumMonths = unstable_cache(
  async () => {
    const monthStats = await prisma.synaxariumEntry.groupBy({
      by: ['copticMonth'],
      _count: { _all: true },
    });
    const monthCountMap = new Map(monthStats.map((m) => [m.copticMonth, m._count._all]));
    return COPTIC_MONTHS.map((m) => ({
      ...m,
      entriesCount: monthCountMap.get(m.month) || 0,
    }));
  },
  ['orthodox-synaxarium-months'],
  { revalidate: 3600 },
);

export async function getSynaxariumToday(date?: string) {
  const today = getCopticDateFromIso(date);

  let items = await prisma.synaxariumEntry.findMany({
    where: {
      copticMonth: today.copticMonth,
      copticDay: today.copticDay,
    },
    select: SYNAXARIUM_SELECT,
    orderBy: { entryOrder: 'asc' },
  });

  // Fallback to day 5 of Nesie in non-leap years if day 6 has no recorded commemoration
  if (items.length === 0 && today.copticMonth === 13 && today.copticDay === 6) {
    items = await prisma.synaxariumEntry.findMany({
      where: { copticMonth: 13, copticDay: 5 },
      select: SYNAXARIUM_SELECT,
      orderBy: { entryOrder: 'asc' },
    });
  }

  return { today, items };
}

export async function listSynaxarium(params: { month?: string; day?: string; q?: string }) {
  const { month, day, q = '' } = params;
  const today = getCopticDateFromIso();
  const normalized = normalizeArabic(q);

  const parsedMonth = month && /^\d+$/.test(month) ? parseInt(month, 10) : undefined;
  const parsedDay = day && /^\d+$/.test(day) ? parseInt(day, 10) : undefined;

  const targetMonth =
    parsedMonth && parsedMonth >= 1 && parsedMonth <= 13
      ? parsedMonth
      : normalized
        ? undefined
        : today.copticMonth;

  const where: Prisma.SynaxariumEntryWhereInput = {
    ...(targetMonth ? { copticMonth: targetMonth } : {}),
    ...(parsedDay && parsedDay >= 1 && parsedDay <= 30 ? { copticDay: parsedDay } : {}),
    ...(normalized
      ? {
          AND: normalized
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => ({ normalizedIndex: { contains: word } })),
        }
      : {}),
  };

  const [items, months] = await Promise.all([
    prisma.synaxariumEntry.findMany({
      where,
      select: SYNAXARIUM_SELECT,
      orderBy: [{ copticMonth: 'asc' }, { copticDay: 'asc' }, { entryOrder: 'asc' }],
      take: normalized ? 80 : 350,
    }),
    getCachedSynaxariumMonths(),
  ]);

  return {
    today,
    selectedMonth: targetMonth || null,
    selectedDay: parsedDay || null,
    months,
    total: items.length,
    items,
  };
}
