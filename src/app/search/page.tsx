import { SectionIcon } from '@/components/SectionIcon';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { fetchServerApi, queryString, sectionHref, type ApologeticsSummaryDto, type SynaxariumEntryDto } from '@/lib/api';
import { apologeticsCollections, matchesMediaQuery, videoCategories, videos } from '@/lib/media-catalog';
import { SermonPlayButton } from '@/components/SermonPlayButton';
import { OccasionDates } from '@/components/ChurchOccasions';
import { cairoToday, churchHymns, georgeCelebration, matchesOccasion, occasionHref, occasionsForDate } from '@/lib/church-calendar';
import { searchSynaxarium } from '@/lib/synaxarium-search';

export const dynamic = 'force-dynamic';

interface SearchRes {
  query: string;
  verses: Array<{
    id: number;
    chapter: number;
    verseNumber: number;
    textTashkeel: string;
    book: { slug: string; nameAr: string };
  }>;
  books: Array<{
    id: number;
    slug: string;
    title: string;
    author: { name: string };
    category: { name: string };
  }>;
  articles: Array<{
    id: number;
    slug: string;
    title: string;
    summary: string;
    category: { name: string };
  }>;
  sermons: Array<{
    id: number;
    slug: string;
    title: string;
    mediaUrl: string;
    preacher: { name: string };
  }>;
  apologetics?: ApologeticsSummaryDto[];
  synaxarium?: SynaxariumEntryDto[];
}

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = queryString((await searchParams).q);
  const matchedVideos = q.length >= 2 ? videos.filter((v) => matchesMediaQuery(`${v.title} ${v.description} ${v.credit} ${v.series || ''} ${videoCategories[v.category]}`, q)) : [];
  const matchedBooks = q.length >= 2 ? apologeticsCollections.flatMap((group) => group.books
    .filter((book) => matchesMediaQuery(`${book.title} ${book.author} ${book.description} ${group.title}`, q))) : [];
  const today = cairoToday();
  const [data, calendar, saints] = q.length >= 2 ? await Promise.all([
    fetchServerApi<SearchRes>(`/api/search?q=${encodeURIComponent(q)}`, 0).catch(() => null),
    occasionsForDate(today),
    searchSynaxarium(q, Number(today.slice(0, 4))),
  ]) : [null, null, []] as const;
  const matchedOccasions = [...churchHymns, ...(calendar?.events ?? [])]
    .filter((event) => matchesOccasion(event, q))
    .sort((a, b) => Number(!!a.start && (a.end ?? a.start) < today) - Number(!!b.start && (b.end ?? b.start) < today))
    .slice(0, 16);
  if (matchesOccasion(georgeCelebration, q) && !matchedOccasions.some((event) => event.id === georgeCelebration.id)) {
    matchedOccasions.unshift(georgeCelebration);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-4">
        <h1 className="section-page-title font-scripture text-3xl font-bold" style={{ color: 'var(--accent-burgundy)' }}><SectionIcon name="search" />
          البحث الشامل في المنصة
        </h1>
        <form action="/search" method="GET" className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              aria-label="ابحث في الموقع"
              name="q"
              defaultValue={q}
              placeholder="ابحث عن آية، كتاب، مناسبة أو لحن..."
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
            بحث
          </button>
        </form>
      </div>

      {q.length < 2 && <p className="media-muted text-sm">اكتب حرفين على الأقل. جرّب «تسبحة مار جرجس» أو «أحد السعف».</p>}
      {(matchedOccasions.length > 0 || saints.length > 0) && (
        <section className="card-manuscript p-5 space-y-3" aria-labelledby="church-results">
          <h2 id="church-results" className="font-bold text-lg">المناسبات القبطية والسنكسار والألحان</h2>
          <ul className="space-y-3">
            {matchedOccasions.map((occasion) => (
              <li key={occasion.id} className="space-y-1">
                <Link className="font-bold underline underline-offset-4" href={occasionHref(occasion)}>{occasion.title}</Link>
                <p className="media-muted text-xs">{occasion.kind}{occasion.start && <> · <OccasionDates occasion={occasion} /></>}</p>
                {occasion.summary && <p className="media-muted text-sm">{occasion.summary}</p>}
              </li>
            ))}
            {saints.map((saint, index) => (
              <li key={`${saint.source}-${index}`}>
                {saint.date ? (
                  <Link className="underline underline-offset-4" href={sectionHref('/liturgy', { date: saint.date }) + '#synaxarium'}>{saint.title}</Link>
                ) : (
                  <a className="underline underline-offset-4" href={saint.source}>{saint.title}</a>
                )}
                <span className="media-muted text-xs"> · السنكسار · {saint.copticDate}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {q.length >= 2 && !data && <p role="status" className="card-manuscript p-4">تعذّر البحث في الأرشيف مؤقتًا. جرّب مرة أخرى.</p>}
      {(matchedVideos.length > 0 || matchedBooks.length > 0) && (
        <section className="card-manuscript p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg">فيديوهات وكتب دفاعية</h2>
            {matchedVideos.length > 24 && (
              <Link className="text-xs font-bold underline" href={sectionHref('/videos', { q }) + '#watch'}>
                عرض جميع نتائج الفيديو ({matchedVideos.length})
              </Link>
            )}
          </div>
          <ul className="space-y-2">
            {matchedVideos.slice(0, 24).map((v) => (
              <li key={v.id}><Link className="underline" href={`/videos?video=${v.id}#watch`}>{v.title}</Link> · {videoCategories[v.category]}</li>
            ))}
            {matchedBooks.map((book) => (
              <li key={book.slug}><Link className="underline" href={`/library/${encodeURIComponent(book.slug)}/read`}>{book.title}</Link> · {book.author}</li>
            ))}
          </ul>
        </section>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              الكتاب المقدس ({data.verses.length})
            </h2>
            {data.verses.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد آيات مطابقة.</p>
            ) : (
              data.verses.map((v) => (
                <Link
                  key={v.id}
                  href={`/bible/${v.book.slug}/${v.chapter}#verse-${v.verseNumber}`}
                  className="block p-3 rounded-lg border hover:border-[#B68A35]"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                    {v.book.nameAr} {v.chapter}: {v.verseNumber}
                  </div>
                  <p className="font-scripture text-base mt-0.5">{v.textTashkeel}</p>
                </Link>
              ))
            )}
          </section>

          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              مكتبة الكتب ({data.books.length})
            </h2>
            {data.books.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد كتب مطابقة.</p>
            ) : (
              data.books.map((b) => (
                <Link
                  key={b.id}
                  href={`/library/${encodeURIComponent(b.slug)}`}
                  className="block p-3 rounded-lg border hover:border-[#B68A35]"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="font-bold text-sm">{b.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {b.author.name} • {b.category.name}
                  </div>
                </Link>
              ))
            )}
          </section>

          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              الشروحات والأسئلة ({data.articles.length})
            </h2>
            {data.articles.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد مقالات مطابقة.</p>
            ) : (
              data.articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/explanations/${encodeURIComponent(a.slug)}`}
                  className="block p-3 rounded-lg border hover:border-[#B68A35]"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="font-bold text-sm">{a.title}</div>
                  <div className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {a.summary}
                  </div>
                </Link>
              ))
            )}
          </section>

          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              العظات ({data.sermons.length})
            </h2>
            {data.sermons.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد عظات مطابقة.</p>
            ) : (
              data.sermons.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border flex items-center justify-between gap-2"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{s.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.preacher.name}</div>
                  </div>
                  <SermonPlayButton
                    slug={s.slug}
                    title={s.title}
                    preacherName={s.preacher.name}
                    mediaUrl={s.mediaUrl}
                  />
                </div>
              ))
            )}
          </section>

          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              الرد على الشبهات والدفاعيات ({data.apologetics?.length || 0})
            </h2>
            {!data.apologetics?.length ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد شبهات مطابقة في الموسوعة.</p>
            ) : (
              data.apologetics.map((ap) => (
                <Link
                  key={ap.slug}
                  href={`/apologetics/${encodeURIComponent(ap.slug)}`}
                  className="block p-3 rounded-lg border hover:border-[#B68A35]"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>{ap.domainAr}</div>
                  <div className="font-bold text-sm mt-0.5">{ap.question}</div>
                  <div className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>{ap.shortSummary}</div>
                </Link>
              ))
            )}
          </section>

          <section className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--accent-burgundy)' }}>
              السنكسار القبطي وسير القديسين ({data.synaxarium?.length || 0})
            </h2>
            {!data.synaxarium?.length ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد سير قديسين مطابقة في السنكسار.</p>
            ) : (
              data.synaxarium.map((syn) => (
                <Link
                  key={syn.id}
                  href={`/synaxarium?month=${syn.copticMonth}&day=${syn.copticDay}`}
                  className="block p-3 rounded-lg border hover:border-[#B68A35]"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                    {syn.copticDay} {syn.monthNameAr}
                  </div>
                  <div className="font-bold text-sm mt-0.5">{syn.saintTitle}</div>
                </Link>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
