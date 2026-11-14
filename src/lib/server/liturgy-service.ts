import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import { fetchJson } from './http';
import { cairoTodayIso, getCopticDateFromIso } from './coptic-date';

function validIsoDate(value?: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

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

async function fetchSynaxariumForIso(isoKey: string) {
  const copticInfo = getCopticDateFromIso(isoKey);
  let entries = await prisma.synaxariumEntry.findMany({
    where: {
      copticMonth: copticInfo.copticMonth,
      copticDay: copticInfo.copticDay,
    },
    orderBy: { entryOrder: 'asc' },
    select: SYNAXARIUM_SELECT,
  });

  if (entries.length === 0 && copticInfo.copticMonth === 13 && copticInfo.copticDay === 6) {
    entries = await prisma.synaxariumEntry.findMany({
      where: { copticMonth: 13, copticDay: 5 },
      orderBy: { entryOrder: 'asc' },
      select: SYNAXARIUM_SELECT,
    });
  }

  return { copticInfo, entries };
}

const getCachedDailyLiturgy = unstable_cache(
  async (isoKey: string) => {
    const { copticInfo, entries } = await fetchSynaxariumForIso(isoKey);

    const cached = await prisma.dailyLiturgyCache.findUnique({ where: { gregorianDate: isoKey } });
    if (cached) {
      if (
        (!cached.synaxariumJson || (Array.isArray(cached.synaxariumJson) && cached.synaxariumJson.length === 0)) &&
        entries.length > 0
      ) {
        return prisma.dailyLiturgyCache.update({
          where: { gregorianDate: isoKey },
          data: {
            copticDate: cached.copticDate || copticInfo.label,
            synaxariumJson: entries as unknown as object,
          },
        });
      }
      return cached;
    }

    const katDate = isoKey.split('-').reverse().join('-');
    const [katamerosRes, copticCalRes] = await Promise.allSettled([
      fetchJson<Record<string, unknown>>(
        `https://api.katameros.app/readings/gregorian/${katDate}?languageId=3&bibleId=11`,
        {},
        15000,
      ),
      fetchJson<{ dateString?: string }>(
        `https://api.coptic.io/api/calendar/${isoKey}`,
        { 'X-Client-Name': 'orthodox-portal' },
        10000,
      ),
    ]);

    const katamerosJson = katamerosRes.status === 'fulfilled' ? katamerosRes.value : {};
    const copticDateRaw =
      (katamerosJson as { copticDate?: string })?.copticDate ||
      (copticCalRes.status === 'fulfilled' ? copticCalRes.value?.dateString : null) ||
      copticInfo.label;

    if (Object.keys(katamerosJson).length > 0 || entries.length > 0) {
      return prisma.dailyLiturgyCache.upsert({
        where: { gregorianDate: isoKey },
        update: {
          copticDate: copticDateRaw ? String(copticDateRaw) : copticInfo.label,
          katamerosJson: katamerosJson as object,
          synaxariumJson: entries as unknown as object,
          fetchedAt: new Date(),
        },
        create: {
          gregorianDate: isoKey,
          copticDate: copticDateRaw ? String(copticDateRaw) : copticInfo.label,
          katamerosJson: katamerosJson as object,
          synaxariumJson: entries as unknown as object,
        },
      });
    }

    return {
      gregorianDate: isoKey,
      copticDate: copticDateRaw,
      katamerosJson,
      synaxariumJson: entries,
      fetchedAt: new Date(),
    };
  },
  ['orthodox-daily-liturgy'],
  { revalidate: 300 },
);

export async function getDailyLiturgy(dateInput?: string) {
  const isoKey = validIsoDate(dateInput) ? dateInput : cairoTodayIso();
  return getCachedDailyLiturgy(isoKey);
}

export const getLiturgicalBooks = unstable_cache(
  async () =>
    prisma.book.findMany({
      where: {
        status: 'PUBLISHED',
        format: 'HTML_CHAPTERS',
        category: { slug: 'liturgy-and-rites' },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        pageCount: true,
        chapters: {
          select: { chapterNumber: true, title: true },
          orderBy: { chapterNumber: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    }),
  ['orthodox-liturgical-books'],
  { revalidate: 3600 },
);

export async function getAgpeyaHour(hour = 'prime') {
  const allowed = ['prime', 'terce', 'sext', 'none', 'vespers', 'compline', 'midnight'];
  const safeHour = allowed.includes(hour) ? hour : 'prime';
  return fetchJson<Record<string, unknown>>(
    `https://api.coptic.io/api/agpeya/${safeHour}`,
    { 'X-Client-Name': 'orthodox-portal' },
    12000,
  );
}
