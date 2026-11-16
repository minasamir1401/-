import Link from 'next/link';
import { BookOpen, ChevronDown, Download, MessageSquarePlus, Search } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';
import { fetchServerApi, queryString, sectionHref, type ApologeticsEntryDto } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const DOMAIN_SEO_TITLES: Record<string, string> = {
  'trinity-christology': 'الرد على شبهات الثالوث ولاهوت المسيح',
  scripture: 'الرد على شبهات الكتاب المقدس والمخطوطات والأبوكريفا',
  'incarnation-salvation': 'الرد على شبهات التجسد والفداء والصليب والقيامة',
  'atheism-science': 'الرد على الإلحاد وبراهين وجود الله والعلم',
  'sectarian-heresies': 'اللاهوت المقارن والرد على البدع الحديثة',
  'church-history-patristics': 'التاريخ الكنسي والمجامع المسكونية وأقوال الآباء',
  'comparative-religions': 'مقارنة الأديان والشبهات العامة',
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const domain = queryString(params.domain);
  const q = queryString(params.q);
  const domainTitle = DOMAIN_SEO_TITLES[domain];
  return buildPageMetadata({
    title: q
      ? `البحث في الشبهات: ${q}`
      : domainTitle || 'موسوعة الرد على الشبهات واللاهوت الدفاعي الأرثوذكسي',
    description:
      'موسوعة دفاعية أرثوذكسية موثقة بالكتاب المقدس وأقوال الآباء والتاريخ الكنسي للرد على الشبهات اللاهوتية والكتابية وأهم 20 كتاباً دفاعياً.',
    path: !q && domainTitle ? `/apologetics?domain=${encodeURIComponent(domain)}` : '/apologetics',
    keywords: ['الرد على الشبهات', 'اللاهوت الدفاعي', 'الثالوث ولاهوت المسيح', 'كتب الدفاعيات الأرثوذكسية'],
    noIndex: Boolean(q),
  });
}

interface ApologeticsListRes {
  domains: Array<{ key: string; label: string; count: number }>;
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  items: ApologeticsEntryDto[];
}

interface FeaturedDefenseBook {
  id: number;
  slug: string;
  title: string;
  description: string;
  format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
  pageCount: number | null;
  author: { name: string; slug: string };
  category: { name: string; slug: string };
  _count?: { chapters: number };
}

interface FeaturedDefenseRes {
  totalBooks: number;
  groups: Array<{
    id: string;
    title: string;
    description: string;
    books: FeaturedDefenseBook[];
  }>;
}

export default async function ApologeticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const domain = queryString(params.domain, 'all');
  const q = queryString(params.q);
  const page = queryString(params.page, '1');

  const [data, defenseBooks] = await Promise.all([
    fetchServerApi<ApologeticsListRes>(
      sectionHref('/api/apologetics', {
        domain: domain === 'all' ? '' : domain,
        q,
        page,
        pageSize: '24',
      }),
      60,
    ),
    fetchServerApi<FeaturedDefenseRes>('/api/books/defense-featured', 60).catch(() => null),
  ]);
  const currentPage = data.page || 1;
  const totalPages = data.totalPages || 1;
  const hasActiveFilter = Boolean(q || (domain && domain !== 'all') || currentPage > 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1
              className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--accent-burgundy)' }}
            >
              <SectionArtwork name="apologetics" />
              الرد على الشبهات واللاهوت الدفاعي الأرثوذكسي
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              موسوعة دفاعية موثقة بالكتاب المقدس وأقوال الآباء والتاريخ الكنسي للرد على الشبهات اللاهوتية والكتابية والتاريخية والبدع الحديثة والاعتراضات الإلحادية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/catechism" className="media-action text-xs">
              <SectionIcon name="cross" />
              التعليم العقيدي المنظم
            </Link>
            <Link href="/ask" className="brand-button text-xs">
              <MessageSquarePlus className="w-4 h-4" />
              اطرح شبهة أو سؤالاً
            </Link>
          </div>
        </div>

        <form action="/apologetics" method="GET" className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              defaultValue={q}
              aria-label="ابحث في الشبهات والردود"
              placeholder="ابحث بكلمة مفتاحية: الثالوث، التحريف، التثنية 18، الصلب، القيامة، الإلحاد..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          {domain && domain !== 'all' && <input type="hidden" name="domain" value={domain} />}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            بحث
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {data.domains.map((d) => {
            const active = d.key === domain;
            return (
              <Link
                key={d.key}
                href={sectionHref('/apologetics', { domain: d.key === 'all' ? '' : d.key, q })}
                className="px-3 py-1.5 rounded-full text-xs border font-semibold transition"
                style={{
                  backgroundColor: active ? 'var(--accent-burgundy)' : 'var(--bg-parchment)',
                  color: active ? '#FFFFFF' : 'var(--text-ink)',
                  borderColor: active ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                }}
              >
                {d.label} ({d.count})
              </Link>
            );
          })}
        </div>
      </div>

      {defenseBooks && defenseBooks.groups.some((group) => group.books.length > 0) && (
        <section
          id="orthodox-defense-books"
          aria-labelledby="defense-books-heading"
          className="card-manuscript p-5 md:p-7 scroll-mt-24"
        >
          <details open={!hasActiveFilter} className="group">
            <summary className="list-none cursor-pointer flex flex-wrap items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <div className="space-y-1">
                <h2
                  id="defense-books-heading"
                  className="section-page-title font-scripture text-2xl md:text-3xl font-bold"
                  style={{ color: 'var(--accent-burgundy)' }}
                >
                  <SectionIcon name="book" />
                  أهم {defenseBooks.totalBooks} كتاباً للدفاع والرد عن العقيدة الأرثوذكسية
                </h2>
                <p className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>
                  مختارات أساسية للقراءة المباشرة داخل الموقع أو التحميل في الدفاع العقيدي والرد على الشبهات.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0"
                style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
              >
                <span>عرض / طي المكتبة المختارة ({defenseBooks.totalBooks})</span>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
              </span>
            </summary>

            <div className="grid gap-6 lg:grid-cols-2 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              {defenseBooks.groups.map((group, groupIndex) => {
                const startIndex = defenseBooks.groups
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.books.length, 0);

                return (
                  <div
                    key={group.id}
                    className="rounded-xl border p-4 md:p-5 space-y-3"
                    style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                  >
                    <div className="space-y-1">
                      <h3 className="font-scripture text-xl font-bold">{group.title}</h3>
                      <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                        {group.description}
                      </p>
                    </div>

                    <ol className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                      {group.books.map((book, idx) => {
                        const rank = startIndex + idx + 1;
                        const chapterCount = book._count?.chapters ?? book.pageCount ?? 0;

                        return (
                          <li
                            key={book.id}
                            className="py-3.5 first:pt-2 last:pb-1 flex gap-3 items-start"
                            style={{ borderColor: 'var(--border-hairline)' }}
                          >
                            <span
                              className="shrink-0 rounded-full grid place-items-center w-7 h-7 text-xs font-bold mt-0.5"
                              style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
                            >
                              {rank}
                            </span>

                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <Link
                                  href={`/library/${encodeURIComponent(book.slug)}`}
                                  className="font-bold text-sm hover:underline"
                                >
                                  {book.title}
                                </Link>
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                                  style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
                                >
                                  {book.format === 'HTML_CHAPTERS' && chapterCount > 0 ? `${chapterCount} فصلاً` : 'PDF'}
                                </span>
                              </div>

                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Link
                                  href={`/authors/${encodeURIComponent(book.author.slug)}`}
                                  className="hover:underline font-medium"
                                >
                                  {book.author.name}
                                </Link>
                              </div>

                              <p className="text-xs leading-6 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                {book.description}
                              </p>

                              <div className="flex flex-wrap gap-2 pt-0.5">
                                <Link
                                  href={`/library/${encodeURIComponent(book.slug)}/read`}
                                  className="media-action media-action-active text-xs !py-1 !px-2.5"
                                >
                                  <BookOpen className="w-3.5 h-3.5" aria-hidden />
                                  <span>اقرأ داخل الموقع</span>
                                </Link>
                                <a
                                  href={`/library/${encodeURIComponent(book.slug)}/file/download`}
                                  className="media-action text-xs !py-1 !px-2.5"
                                >
                                  <Download className="w-3.5 h-3.5" aria-hidden />
                                  <span>تحميل</span>
                                </a>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </details>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>
          إجمالي {data.total} دراسة ورد موثق (صفحة {currentPage} من {totalPages})
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/library?category=orthodox-defense" className="underline text-xs" style={{ color: 'var(--accent-burgundy)' }}>
            كتب الدفاع عن العقيدة
          </Link>
          <Link href="/library?category=apologetics-questions" className="underline text-xs" style={{ color: 'var(--accent-burgundy)' }}>
            تصفح كل كتب الرد والدفاع في المكتبة
          </Link>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="card-manuscript p-10 text-center space-y-3">
          <p className="font-bold">لم يتم العثور على شبهات مطابقة لعبارة البحث.</p>
          <div className="flex justify-center gap-3">
            <Link href="/apologetics" className="media-action text-xs">
              عرض جميع الشبهات
            </Link>
            <Link href="/ask" className="brand-button text-xs">
              أرسل سؤالك للإجابة عليه
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.items.map((item) => (
            <article key={item.id} className="card-manuscript p-6 md:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-bold"
                    style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
                  >
                    {item.domainAr}
                  </span>
                  {item.bibleRefs && item.bibleRefs.length > 0 && (
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {item.bibleRefs.length} شواهد كتابية موثقة
                    </span>
                  )}
                </div>

                <h2 className="font-scripture text-xl md:text-[1.35rem] font-bold leading-relaxed">
                  <Link href={`/apologetics/${encodeURIComponent(item.slug)}`} className="hover:underline">
                    {item.question}
                  </Link>
                </h2>

                <p className="text-sm md:text-[0.95rem] leading-8" style={{ color: 'var(--text-muted)' }}>
                  {item.shortSummary}
                </p>

                {item.bibleRefs && item.bibleRefs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.bibleRefs.slice(0, 5).map((ref, idx) => (
                      <Link
                        key={`${ref.book.slug}-${ref.chapter}-${idx}`}
                        href={`/bible/${ref.book.slug}/${ref.chapter}`}
                        className="text-xs px-2.5 py-1 rounded border hover:underline"
                        style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                      >
                        {ref.verseLabel || `${ref.book.nameAr} ${ref.chapter}`}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                <Link
                  href={`/apologetics/${encodeURIComponent(item.slug)}`}
                  className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
                  style={{ color: 'var(--accent-burgundy)' }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>اقرأ التبسيط والرد الموثق كاملاً</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        path="/apologetics"
        filters={{ domain: domain === 'all' ? '' : domain, q }}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
