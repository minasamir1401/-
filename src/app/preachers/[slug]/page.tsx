import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Download } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { SectionIcon } from '@/components/SectionIcon';
import { SermonPlayButton } from '@/components/SermonPlayButton';
import { ApiError, fetchServerApi, formatDuration } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildProfileJsonLd,
  resolveRuntimeOrigin,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PreacherProfileRes {
  preacher: {
    id: number;
    name: string;
    slug: string;
    bio: string | null;
  };
  sermons: Array<{
    id: number;
    slug: string;
    title: string;
    description: string | null;
    mediaUrl: string;
    durationSeconds: number | null;
    playsCount: number;
    sourceName: string;
    series: { title: string; slug: string } | null;
  }>;
}

function displayPreacherName(name: string): string {
  return name === 'Father Makary Younan__ابونا مكاري' ? 'القمص مكاري يونان' : name;
}

async function loadPreacherProfile(rawSlug: string): Promise<PreacherProfileRes> {
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    notFound();
  }

  try {
    return await fetchServerApi<PreacherProfileRes>(`/api/preachers/${encodeURIComponent(slug)}`, 60);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { preacher, sermons } = await loadPreacherProfile(slug);
  const name = displayPreacherName(preacher.name);
  return buildPageMetadata({
    title: `عظات وتأملات ${name} (${sermons.length})`,
    description: preacher.bio || `استمع وحمّل عظات وتأملات ${name} الصوتية في مكتبة المنارة الأرثوذكسية (${sermons.length} عظة).`,
    path: `/preachers/${encodeURIComponent(preacher.slug)}`,
    type: 'profile',
    keywords: [name, `عظات ${name}`, 'العظات الصوتية القبطية'],
  });
}

export default async function PreacherDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const [data, origin] = await Promise.all([
    loadPreacherProfile(rawSlug),
    resolveRuntimeOrigin(),
  ]);

  const { preacher, sermons } = data;
  const preacherName = displayPreacherName(preacher.name);
  const preacherPath = `/preachers/${encodeURIComponent(preacher.slug)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <JsonLd
        data={[
          buildBreadcrumbJsonLd(origin, [
            { name: 'الرئيسية', path: '/' },
            { name: 'العظات الصوتية', path: '/sermons' },
            { name: preacherName, path: preacherPath },
          ]),
          buildProfileJsonLd(origin, {
            name: preacherName,
            description: preacher.bio || `عظات وتأملات ${preacherName} (${sermons.length} عظة)`,
            path: preacherPath,
            jobTitle: 'واعظ ومعلم كنسي قبطي أرثوذكسي',
          }),
        ]}
      />
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:underline">الرئيسية</Link>
          <span>/</span>
          <Link href="/sermons" className="hover:underline">العظات الصوتية</Link>
          <span>/</span>
          <span>{preacher.name}</span>
        </div>
        <Link href="/sermons" className="inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--accent-burgundy)' }}>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>كل العظات</span>
        </Link>
      </div>

      <section className="card-manuscript section-page-banner p-6 md:p-8 space-y-3">
        <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
          <SectionIcon name="sermons" />
          {preacher.name}
        </h1>
        {preacher.bio ? (
          <p className="text-sm leading-7 max-w-3xl" style={{ color: 'var(--text-muted)' }}>{preacher.bio}</p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            مجموعة العظات الصوتية والتأملات الروحية المسجلة.
          </p>
        )}
        <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
          إجمالي العظات المتاحة للاستماع: {sermons.length} عظة
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {sermons.map((s) => (
          <article key={s.id} className="card-manuscript p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              {s.series && (
                <Link
                  href={`/sermons?topic=${encodeURIComponent(s.series.slug)}`}
                  className="text-xs font-bold hover:underline inline-block"
                  style={{ color: 'var(--accent-gold)' }}
                >
                  {s.series.title}
                </Link>
              )}
              <h2 className="font-bold text-base leading-snug">{s.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                {s.durationSeconds ? <span>المدة: {formatDuration(s.durationSeconds)}</span> : null}
                <span>المصدر: {s.sourceName}</span>
                <a href={s.mediaUrl} download className="inline-flex items-center gap-1 underline">
                  <Download className="w-3 h-3" />
                  <span>تنزيل MP3</span>
                </a>
              </div>
            </div>

            <SermonPlayButton
              slug={s.slug}
              title={s.title}
              preacherName={preacher.name}
              mediaUrl={s.mediaUrl}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
