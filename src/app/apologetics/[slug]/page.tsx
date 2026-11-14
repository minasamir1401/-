import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { SectionIcon } from '@/components/SectionIcon';
import { ApiError, fetchServerApi, type ApologeticsEntryDto } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface ApologeticsDetailRes {
  entry: ApologeticsEntryDto;
  relatedBooks: Array<{
    id: number;
    slug: string;
    title: string;
    format: string;
    author: { name: string; slug: string };
    category: { name: string; slug: string };
  }>;
  relatedArticles: Array<{
    id: number;
    slug: string;
    title: string;
    summary: string;
    category: { name: string; slug: string };
  }>;
  siblingEntries: Array<{ slug: string; question: string; domainAr: string }>;
}

export default async function ApologeticsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    notFound();
  }
  let data: ApologeticsDetailRes;

  try {
    data = await fetchServerApi<ApologeticsDetailRes>(`/api/apologetics/${encodeURIComponent(slug)}`, 60);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { entry, relatedBooks, relatedArticles, siblingEntries } = data;
  const sources = Array.isArray(entry.sourcesJson) ? entry.sourcesJson : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:underline">الرئيسية</Link>
          <span>/</span>
          <Link href="/apologetics" className="hover:underline">الرد على الشبهات</Link>
          <span>/</span>
          <Link href={`/apologetics?domain=${encodeURIComponent(entry.domain)}`} className="hover:underline">
            {entry.domainAr}
          </Link>
        </div>
        <Link href="/apologetics" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--accent-burgundy)' }}>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقسم الشبهات</span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <article className="lg:col-span-8 card-manuscript p-6 md:p-8 space-y-6">
          <div className="space-y-3 border-b pb-5" style={{ borderColor: 'var(--border-hairline)' }}>
            <span
              className="inline-block text-xs px-3 py-1 rounded-full font-bold"
              style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
            >
              {entry.domainAr}
            </span>
            <h1 className="font-scripture text-2xl md:text-4xl font-bold leading-snug" style={{ color: 'var(--heading-ink)' }}>
              {entry.question}
            </h1>
            <div className="rounded-lg p-4 border" style={{ borderColor: 'var(--accent-gold)', backgroundColor: 'var(--bg-parchment)' }}>
              <h2 className="text-xs font-bold mb-1" style={{ color: 'var(--accent-burgundy)' }}>
                الخلاصة الأرثوذكسية
              </h2>
              <p className="text-sm leading-7 font-medium">{entry.shortSummary}</p>
            </div>
          </div>

          <div
            className="prose-arabic text-base md:text-lg leading-loose"
            dangerouslySetInnerHTML={{ __html: entry.answerHtml }}
          />

          {sources.length > 0 && (
            <div className="pt-5 border-t space-y-3" style={{ borderColor: 'var(--border-hairline)' }}>
              <h2 className="font-scripture text-xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                المراجع والمصادر الكنسية الموثقة
              </h2>
              <ul className="space-y-2 text-sm">
                {sources.map((src, idx) => (
                  <li key={idx}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 underline hover:opacity-80"
                      style={{ color: 'var(--accent-burgundy)' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>{src.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <aside className="lg:col-span-4 space-y-5">
          {entry.bibleRefs && entry.bibleRefs.length > 0 && (
            <section className="card-manuscript p-5 space-y-3">
              <h2 className="section-page-title font-bold text-base">
                <SectionIcon name="bible" />
                الشواهد الكتابية المرتبطة
              </h2>
              <div className="flex flex-wrap gap-2">
                {entry.bibleRefs.map((ref, idx) => (
                  <Link
                    key={`${ref.book.slug}-${ref.chapter}-${idx}`}
                    href={`/bible/${ref.book.slug}/${ref.chapter}`}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:underline"
                    style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                  >
                    {ref.verseLabel || `${ref.book.nameAr} ${ref.chapter}`}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedBooks.length > 0 && (
            <section className="card-manuscript p-5 space-y-3">
              <h2 className="section-page-title font-bold text-base">
                <SectionIcon name="library" />
                كتب مرجعية في المكتبة
              </h2>
              <ul className="space-y-2.5">
                {relatedBooks.map((b) => (
                  <li key={b.id} className="pb-2.5 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--border-hairline)' }}>
                    <Link href={`/library/${b.slug}`} className="font-bold text-sm hover:underline flex items-start gap-2">
                      <BookOpen className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-burgundy)' }} />
                      <span>{b.title}</span>
                    </Link>
                    <div className="text-xs mt-1 pr-6" style={{ color: 'var(--text-muted)' }}>
                      <Link href={`/authors/${encodeURIComponent(b.author.slug)}`} className="hover:underline">
                        {b.author.name}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section className="card-manuscript p-5 space-y-3">
              <h2 className="section-page-title font-bold text-base">
                <SectionIcon name="explanations" />
                مقالات وإجابات ذات صلة
              </h2>
              <ul className="space-y-2.5 text-sm">
                {relatedArticles.map((art) => (
                  <li key={art.id} className="pb-2.5 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--border-hairline)' }}>
                    <Link href={`/explanations/${encodeURIComponent(art.slug)}`} className="font-bold hover:underline block">
                      {art.title}
                    </Link>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{art.category.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {siblingEntries.length > 0 && (
            <section className="card-manuscript p-5 space-y-3">
              <h2 className="section-page-title font-bold text-base">
                <SectionIcon name="shield" />
                موضوعات في نفس المحور
              </h2>
              <ul className="space-y-2 text-xs">
                {siblingEntries.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/apologetics/${encodeURIComponent(s.slug)}`} className="hover:underline font-medium block py-0.5">
                      {s.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="card-manuscript p-5 space-y-3">
            <h2 className="font-bold text-sm">هل لديك تساؤل إضافي حول هذه الشبهة؟</h2>
            <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
              أرسل استفسارك مع ذكر الشاهد الكتابي ليتم بحثه والرد عليه وفق التعليم الأرثوذكسي.
            </p>
            <Link href="/ask" className="brand-button w-full text-xs">
              <MessageSquarePlus className="w-4 h-4" />
              <span>أرسل سؤالاً جديداً</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
