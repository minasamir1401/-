import Link from 'next/link';
import { Calendar, Search } from 'lucide-react';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';
import { fetchServerApi, queryString, sectionHref, type CopticDateInfoDto, type SynaxariumEntryDto } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = queryString(params.q);
  return buildPageMetadata({
    title: q ? `البحث في السنكسار القبطي: ${q}` : 'السنكسار القبطي الكامل (13 شهراً)',
    description:
      'سير الشهداء والقديسين والأعياد الكنسية اليومية في الكنيسة القبطية الأرثوذكسية مرتبة على مدار الـ 13 شهراً قبطياً.',
    path: '/synaxarium',
    keywords: ['السنكسار القبطي', 'سنكسار اليوم', 'سير القديسين والشهداء', 'التقويم القبطي'],
    noIndex: Boolean(q),
  });
}

interface SynaxariumRes {
  today: CopticDateInfoDto;
  selectedMonth: number | null;
  selectedDay: number | null;
  months: Array<{ month: number; nameAr: string; days: number; entriesCount: number }>;
  total: number;
  items: SynaxariumEntryDto[];
}

export default async function SynaxariumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const month = queryString(params.month);
  const day = queryString(params.day);
  const q = queryString(params.q);

  const data = await fetchServerApi<SynaxariumRes>(
    sectionHref('/api/synaxarium', { month, day, q }),
    60,
  );

  const activeMonthMeta = data.selectedMonth
    ? data.months.find((m) => m.month === data.selectedMonth)
    : null;

  const groupedByDay = new Map<string, { monthNameAr: string; copticMonth: number; copticDay: number; entries: SynaxariumEntryDto[] }>();
  for (const item of data.items) {
    const key = `${item.copticMonth}-${item.copticDay}`;
    const existing = groupedByDay.get(key) || {
      monthNameAr: item.monthNameAr,
      copticMonth: item.copticMonth,
      copticDay: item.copticDay,
      entries: [],
    };
    existing.entries.push(item);
    groupedByDay.set(key, existing);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1
              className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--accent-burgundy)' }}
            >
              <SectionArtwork name="synaxarium" />
              السنكسار القبطي الأرثوذكسي وسير القديسين
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              سير الآباء البطاركة والشهداء والمعترفين والقديسين والأعياد الكنسية مرتبة على مدار الشهور القبطية الثلاثة عشر (توت — النسئ).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={sectionHref('/synaxarium', {
                month: String(data.today.copticMonth),
                day: String(data.today.copticDay),
              })}
              className="brand-button text-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>سنكسار اليوم ({data.today.label})</span>
            </Link>
            <Link href="/liturgy" className="media-action text-xs">
              <SectionIcon name="liturgy" />
              <span>القطمارس والأجبية</span>
            </Link>
          </div>
        </div>

        <form action="/synaxarium" method="GET" className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              defaultValue={q}
              aria-label="ابحث في السنكسار القبطي"
              placeholder="ابحث باسم القديس أو الشهيد أو الحدث الكنسي (مثل: مارمرقس، الأنبا أنطونيوس، دميانة)..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            بحث في السنكسار
          </button>
        </form>

        <div className="space-y-2">
          <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            الشهور القبطية (١٣ شهراً):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.months.map((m) => {
              const active = data.selectedMonth === m.month && !q;
              return (
                <Link
                  key={m.month}
                  href={`/synaxarium?month=${m.month}`}
                  className="px-3 py-1.5 rounded-lg text-xs border font-semibold transition"
                  style={{
                    backgroundColor: active ? 'var(--accent-burgundy)' : 'var(--bg-parchment)',
                    color: active ? '#FFFFFF' : 'var(--text-ink)',
                    borderColor: active ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                  }}
                >
                  {m.nameAr}
                </Link>
              );
            })}
          </div>
        </div>

        {activeMonthMeta && !q && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                أيام شهر {activeMonthMeta.nameAr}:
              </span>
              {data.selectedDay && (
                <Link href={`/synaxarium?month=${activeMonthMeta.month}`} className="underline">
                  عرض كل الشهر
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: activeMonthMeta.days }, (_, idx) => idx + 1).map((d) => {
                const isSelected = data.selectedDay === d;
                const isToday = data.today.copticMonth === activeMonthMeta.month && data.today.copticDay === d;
                return (
                  <Link
                    key={d}
                    href={`/synaxarium?month=${activeMonthMeta.month}&day=${d}`}
                    className="w-8 h-8 rounded border flex items-center justify-center text-xs font-bold transition"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--accent-burgundy)'
                        : isToday
                          ? 'var(--bg-surface-muted)'
                          : 'var(--bg-parchment)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-ink)',
                      borderColor: isToday ? 'var(--accent-gold)' : 'var(--border-hairline)',
                    }}
                  >
                    {d}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {groupedByDay.size === 0 ? (
        <div className="card-manuscript p-10 text-center space-y-3">
          <p className="font-bold">لا توجد تذكارات مطابقة لبحثك في السنكسار.</p>
          <Link href="/synaxarium" className="brand-button text-xs">
            العودة إلى سنكسار الشهر الحالي
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByDay.values()).map((dayGroup) => (
            <section
              key={`${dayGroup.copticMonth}-${dayGroup.copticDay}`}
              className="card-manuscript p-6 md:p-7 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                <h2 className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                  {dayGroup.copticDay} {dayGroup.monthNameAr}
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--text-muted)' }}>
                  {dayGroup.entries.length} تذكار
                </span>
              </div>

              <div className="space-y-5">
                {dayGroup.entries.map((entry) => (
                  <article key={entry.id} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--border-hairline)' }}>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--heading-ink)' }}>
                      {entry.saintTitle}
                    </h3>
                    <div
                      className="prose-arabic text-sm md:text-base leading-8"
                      dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
                    />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
