import { SectionArtwork } from '@/components/SectionArtwork';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { fetchServerApi, formatDuration, queryString, sectionHref } from '@/lib/api';
import { SermonPlayButton } from '@/components/SermonPlayButton';
import { Pagination } from '@/components/Pagination';
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
    title: q ? `نتائج البحث في العظات: ${q}` : 'مكتبة العظات والتأملات الصوتية',
    description:
      'استمع وحمّل مئات العظات والتأملات الصوتية والروحية لأباء الكنيسة القبطية الأرثوذكسية في الكتاب المقدس والعقيدة والحياة الروحية.',
    path: '/sermons',
    keywords: ['عظات قبطية', 'تأملات صوتية', 'عظات البابا شنودة', 'القمص مكاري يونان'],
    noIndex: Boolean(q),
  });
}

interface SermonsRes {
  items: Array<{
    id: number;
    slug: string;
    title: string;
    description: string | null;
    mediaType: 'AUDIO_MP3' | 'YOUTUBE_VIDEO' | 'TEXT';
    mediaUrl: string;
    durationSeconds: number | null;
    playsCount: number;
    sourceName: string;
    sourceUrl: string;
    series: { title: string } | null;
    preacher: { name: string; slug: string };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

interface PreachersRes {
  preachers: Array<{ id: number; name: string; slug: string; _count: { sermons: number } }>;
  topics: Array<{ slug: string; title: string }>;
}

const preacherLabel = (name: string) => name === 'Father Makary Younan__ابونا مكاري' ? 'القمص مكاري يونان' : name;

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = queryString(params.q);
  const preacher = queryString(params.preacher);
  const topic = queryString(params.topic);
  const page = queryString(params.page, '1');
  const filters = { q, preacher, topic };

  const [sermonsData, preachersData] = await Promise.all([
    fetchServerApi<SermonsRes>(sectionHref('/api/sermons', { ...filters, page, pageSize: '12' }), 0),
    fetchServerApi<PreachersRes>('/api/sermons/preachers', 60),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}><SectionArtwork name="sermons" />
              قسم العظات والتأملات الصوتية
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              عظات قبطية أرثوذكسية من الأرشيف الكنسي. اختر الواعظ أو الموضوع واستمع أثناء تصفّح الموقع.
            </p>
          </div>
        </div>

        <form action="/sermons" method="GET" className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              aria-label="ابحث في العظات"
              name="q"
              defaultValue={q}
              placeholder="ابحث بعنوان العظة أو اسم الواعظ..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          {preacher && <input type="hidden" name="preacher" value={preacher} />}
          {topic && <input type="hidden" name="topic" value={topic} />}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            بحث
          </button>
        </form>

        <nav aria-label="الوعّاظ" className="flex flex-wrap gap-2">
          <Link
            href={sectionHref('/sermons', { q, topic })}
            aria-current={!preacher ? 'page' : undefined}
            className="px-3 py-1.5 rounded-full text-xs border"
            style={{
              backgroundColor: !preacher ? 'var(--accent-burgundy)' : 'transparent',
              color: !preacher ? '#FFFFFF' : 'var(--text-ink)',
              borderColor: !preacher ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
            }}
          >
            كل الوعّاظ
          </Link>
          {preachersData.preachers.map((p) => (
            <Link
              key={p.id}
              href={sectionHref('/sermons', { q, topic, preacher: p.slug })}
              aria-current={preacher === p.slug ? 'page' : undefined}
              className="px-3 py-1.5 rounded-full text-xs border"
              style={{
                backgroundColor: preacher === p.slug ? 'var(--accent-burgundy)' : 'transparent',
                color: preacher === p.slug ? '#FFFFFF' : 'var(--text-ink)',
                borderColor: preacher === p.slug ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
              }}
            >
              {preacherLabel(p.name)} ({p._count.sermons})
            </Link>
          ))}
        </nav>
        {preachersData.topics?.length > 0 && (
          <nav aria-label="موضوعات العظات" className="flex flex-wrap gap-2">
            {[{ slug: '', title: 'كل المواضيع' }, ...preachersData.topics].map((item) => (
              <Link key={item.slug} href={sectionHref('/sermons', { q, preacher, topic: item.slug })}
                aria-current={topic === item.slug ? 'page' : undefined}
                className={`media-action ${topic === item.slug ? 'media-action-active' : ''}`}>{item.title}</Link>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="media-muted">{sermonsData.total} عظة</p>
          <div className="flex flex-wrap items-center gap-3">
            {preacher && (
              <Link href={`/preachers/${encodeURIComponent(preacher)}`} className="underline font-semibold" style={{ color: 'var(--accent-burgundy)' }}>
                صفحة الواعظ والسيرة الكاملة
              </Link>
            )}
            <Link href="/videos" className="underline">تفضّل المشاهدة؟ فيديوهات وشرح</Link>
          </div>
        </div>
      </div>

      {sermonsData.items.length === 0 ? (
        <div className="card-manuscript p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          لا توجد عظات مطابقة حالياً. <Link href="/sermons" className="underline">امسح التصفية</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sermonsData.items.map((sermon) => (
            <div key={sermon.id} className="card-manuscript p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Link
                    href={`/preachers/${encodeURIComponent(sermon.preacher.slug)}`}
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    {preacherLabel(sermon.preacher.name)}
                  </Link>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatDuration(sermon.durationSeconds) || sermon.series?.title || 'عظة من الأرشيف'}
                  </span>
                </div>
                <h2 className="font-bold text-base">{sermon.title}</h2>
                {sermon.description && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {sermon.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                <a href={sermon.sourceName === 'Internet Archive Audio' ? `https://archive.org/details/${encodeURIComponent(new URL(sermon.mediaUrl).pathname.split('/')[2])}` : sermon.sourceUrl}
                  target="_blank" rel="noreferrer" className="text-xs underline">المصدر</a>
                <div className="flex items-center gap-2">
                  {sermon.mediaType === 'AUDIO_MP3' && (
                    <>
                      <a
                        href={sermon.mediaUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1"
                        style={{ borderColor: 'var(--border-hairline)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>MP3</span>
                      </a>
                      <SermonPlayButton
                        slug={sermon.slug}
                        title={sermon.title}
                        preacherName={preacherLabel(sermon.preacher.name)}
                        mediaUrl={sermon.mediaUrl}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination path="/sermons" filters={filters} page={sermonsData.page} totalPages={sermonsData.totalPages} />
    </div>
  );
}
