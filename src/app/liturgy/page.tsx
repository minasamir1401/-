import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { SectionArtwork } from '@/components/SectionArtwork';
import { fetchServerApi, queryString, type SynaxariumEntryDto } from '@/lib/api';
import { AgpeyaViewer } from '@/components/AgpeyaViewer';
import { AnnualOccasions, OccasionCard, SynaxariumSource } from '@/components/ChurchOccasions';
import { cairoToday, churchHymns, copticDateLabel, georgeCelebration, isCalendarDate, occasionsForDate, synaxariumReadings } from '@/lib/church-calendar';

export const dynamic = 'force-dynamic';

interface LiturgicalBookItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  pageCount: number | null;
  chapters: Array<{ chapterNumber: number; title: string }>;
}

interface KatamerosPassage {
  bookTranslation?: string;
  chapter?: number;
  ref?: string;
  verses?: Array<{ number?: number; text?: string }>;
}

interface KatamerosResponse {
  gregorianDate: string;
  copticDate: string | null;
  synaxariumJson?: SynaxariumEntryDto[] | null;
  katamerosJson: {
    title?: string | null;
    periodInfo?: string | null;
    sections?: Array<{
      id: number;
      title?: string;
      subSections?: Array<{
        id: number;
        title?: string;
        readings?: Array<{
          storyId?: number | null;
          title?: string;
          displayTitle?: string;
          html?: string;
          passages?: KatamerosPassage[];
        }>;
      }>;
    }>;
  };
}

export default async function LiturgyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const date = queryString((await searchParams).date);
  const selectedDate = isCalendarDate(date) ? date : cairoToday();
  const [data, calendar, booksRes] = await Promise.all([
    fetchServerApi<KatamerosResponse>(`/api/liturgy/today?date=${selectedDate}`, 300).catch(() => null),
    occasionsForDate(selectedDate),
    fetchServerApi<{ books: LiturgicalBookItem[] }>('/api/liturgy/books', 300).catch(() => ({ books: [] })),
  ]);
  const sections = data?.katamerosJson?.sections || [];
  const stories = synaxariumReadings(sections);
  const dbSynaxarium = Array.isArray(data?.synaxariumJson) ? data.synaxariumJson : [];
  const liturgicalBooks = booksRes.books || [];
  const hasLocalCelebration = calendar.today.some((event) => event.id === georgeCelebration.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="section-page-title font-scripture text-3xl font-bold"><SectionArtwork name="liturgy" />
            القطمارس والأجبية
          </h1>
          <p className="media-muted text-sm">التاريخ الميلادي <bdi>{selectedDate}</bdi> · القبطي {copticDateLabel(selectedDate)}</p>
          {date && date !== selectedDate && <p className="media-muted text-sm">التاريخ المُدخل غير صالح. تُعرض قراءات اليوم.</p>}
          {data?.katamerosJson?.title && (
            <p className="text-sm" style={{ color: 'var(--accent-gold)' }}>
              {data.katamerosJson.title}
            </p>
          )}
        </div>

        <form id="liturgy-date" action="/liturgy" method="GET" className="flex items-center gap-2 scroll-mt-24">
          <input
            type="date"
            name="date"
            aria-label="تاريخ القراءات"
            defaultValue={selectedDate}
            required
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            عرض التاريخ
          </button>
        </form>
      </div>

      <nav aria-label="أقسام القراءات" className="flex gap-2 flex-wrap">
        <a className="media-action" href="#liturgical-books">الخولاجي والإبصلمودية</a>
        <a className="media-action" href="#church-occasions">المناسبات القبطية</a>
        <a className="media-action" href="#synaxarium">سنكسار اليوم</a>
        <Link className="media-action" href="/synaxarium">السنكسار الكامل</Link>
        <a className="media-action" href="#church-hymns">الألحان والمدائح</a>
        {sections.map((section) => <a key={section.id} className="media-action" href={`#reading-${section.id}`}>{section.title || 'قراءات'}</a>)}
        <a className="media-action" href="#agpeya">صلوات الأجبية</a>
      </nav>
      <section id="church-occasions" className="space-y-4 scroll-mt-24" aria-labelledby="church-occasions-title">
        <h2 id="church-occasions-title" className="font-scripture font-bold text-2xl">المناسبات القبطية في هذا التاريخ</h2>
        {calendar.today.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {calendar.today.map((occasion) => <OccasionCard key={occasion.id} occasion={occasion} />)}
          </div>
        )}
        {!calendar.complete && <p role="status" className="media-muted text-sm">تعذّر تحميل بعض مواعيد الأعياد والأصوام.</p>}
        <AnnualOccasions events={calendar.events} year={Number(selectedDate.slice(0, 4))} />
      </section>
      <section id="synaxarium" className="card-manuscript p-5 md:p-6 space-y-4 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-scripture font-bold text-2xl">سنكسار اليوم</h2>
          <Link href="/synaxarium" className="text-xs font-bold underline" style={{ color: 'var(--accent-burgundy)' }}>
            تصفح السنكسار القبطي (١٣ شهراً)
          </Link>
        </div>
        {dbSynaxarium.length > 0 && (
          <div className="space-y-4">
            {dbSynaxarium.map((entry) => (
              <details key={entry.id || entry.entryOrder} open={entry.entryOrder === 1} className="rounded-lg border p-4" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
                <summary className="cursor-pointer font-bold text-sm" style={{ color: 'var(--accent-burgundy)' }}>
                  {entry.copticDay} {entry.monthNameAr}: {entry.saintTitle}
                </summary>
                <div className="prose-arabic text-sm leading-7 mt-3" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
              </details>
            ))}
          </div>
        )}
        {stories.length > 0 && (
          <ul className="space-y-1 text-sm">
            {stories.map((reading) => (
              <li key={reading.storyId}><a className="underline underline-offset-4" href={`#saint-${reading.storyId}`}>{reading.displayTitle || reading.title}</a></li>
            ))}
          </ul>
        )}
        <SynaxariumSource date={selectedDate} />
      </section>
      {sections.length === 0 && <p role="status" className="card-manuscript p-5">القراءات غير متاحة لهذا التاريخ حاليًا. يمكنك اختيار تاريخ آخر أو متابعة الأجبية.</p>}
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.id} id={`reading-${section.id}`} className="card-manuscript p-6 space-y-5 scroll-mt-24">
            <h2 className="font-scripture text-2xl font-bold pb-3 border-b" style={{ borderColor: 'var(--border-hairline)', color: 'var(--accent-burgundy)' }}>
              {section.title}
            </h2>

            <div className="space-y-5">
              {section.subSections?.map((sub) => (
                <div key={sub.id} className="space-y-3">
                  <h3 className="font-bold text-base" style={{ color: 'var(--accent-gold)' }}>
                    {sub.title}
                  </h3>
                  {sub.readings?.map((reading, idx) => (
                    <div
                      key={idx}
                      id={reading.storyId ? `saint-${reading.storyId}` : undefined}
                      className="p-4 rounded-lg border space-y-2 scroll-mt-24"
                      style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                    >
                      {(reading.displayTitle || reading.title) && (
                        <div className="font-bold text-sm">{reading.displayTitle || reading.title}</div>
                      )}
                      {reading.html && (
                        <div
                          className="prose-arabic font-scripture text-lg"
                          dangerouslySetInnerHTML={{ __html: reading.html }}
                        />
                      )}
                      {reading.passages?.map((p, pIdx) => (
                        <div key={pIdx} className="space-y-1.5">
                          {(p.bookTranslation || p.ref) && (
                            <div className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                              {p.bookTranslation} {p.chapter ? `${p.chapter}:` : ''} {p.ref || ''}
                            </div>
                          )}
                          <p className="font-scripture text-lg leading-loose">
                            {p.verses?.map((v) => `${v.text || ''} (${v.number || ''})`).join(' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="church-hymns" className="space-y-4 scroll-mt-24" aria-labelledby="church-hymns-title">
        <h2 id="church-hymns-title" className="font-scripture font-bold text-2xl">الألحان والمدائح</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {churchHymns.map((occasion) => <OccasionCard key={occasion.id} occasion={occasion} />)}
          {!hasLocalCelebration && <OccasionCard occasion={georgeCelebration} />}
        </div>
      </section>
      <section id="liturgical-books" className="space-y-4 scroll-mt-24" aria-labelledby="liturgical-books-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="liturgical-books-title" className="font-scripture font-bold text-2xl" style={{ color: 'var(--accent-burgundy)' }}>
              الخولاجي المقدس والإبصلمودية وخدمة الشماس
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              نصوص القداسات الثلاثة، رفع بخور عشية وباكر، تسبحة نصف الليل، الإبصلمودية الكيهكية، ومردات الشماس للقراءة المباشرة.
            </p>
          </div>
          <Link href="/library?category=liturgy-and-rites" className="media-action text-xs">
            جميع كتب الليتورجيا في المكتبة
          </Link>
        </div>

        {liturgicalBooks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liturgicalBooks.map((book) => (
              <article key={book.id} className="card-manuscript p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-scripture text-xl font-bold">
                    <Link href={`/library/${encodeURIComponent(book.slug)}`} className="hover:underline">
                      {book.title}
                    </Link>
                  </h3>
                  {book.chapters.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}>
                      {book.chapters.length} قسم
                    </span>
                  )}
                </div>
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>{book.description}</p>
                {book.chapters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {book.chapters.slice(0, 6).map((ch) => (
                      <Link
                        key={ch.chapterNumber}
                        href={`/library/${encodeURIComponent(book.slug)}/read?chapter=${ch.chapterNumber}`}
                        className="text-xs px-2.5 py-1 rounded border hover:underline"
                        style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                      >
                        {ch.title}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <Link href={`/library/${encodeURIComponent(book.slug)}/read`} className="brand-button text-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>فتح النص الكامل للكتاب</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="card-manuscript p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            يمكنك تصفح كتب الليتورجيا مباشرة من <Link href="/library?category=liturgy-and-rites" className="underline">مكتبة الليتورجيا والطقوس</Link>.
          </p>
        )}
      </section>
      <AgpeyaViewer />
    </div>
  );
}
