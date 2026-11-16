import Link from 'next/link';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';
import { fetchServerApi, queryString, sectionHref } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'فهرس تفاسير الكتاب المقدس الآبائية',
  description:
    'فهرس منظم لتفاسير وشروحات أسفار العهد الجديد والعهد القديم والأسفار القانونية الثانية أصحاحاً بأصحاح بحسب التعليم الأرثوذكسي.',
  path: '/commentaries',
  keywords: ['تفاسير الكتاب المقدس', 'تفسير القمص تادرس يعقوب', 'تفسير أنطونيوس فكري', 'شروحات آبائية'],
});

interface CommentaryBooksRes {
  books: Array<{
    id: number;
    slug: string;
    nameAr: string;
    testament: 'OLD' | 'DEUTEROCANON' | 'NEW';
    chaptersCount: number;
    _count: { commentaries: number; apologeticsRefs: number };
    commentators: Array<{ id: number; name: string; slug: string }>;
  }>;
  authors: Array<{
    id: number;
    name: string;
    slug: string;
    _count: { commentaries: number };
  }>;
}

const TESTAMENT_SECTIONS: Array<{ key: 'NEW' | 'OLD' | 'DEUTEROCANON'; title: string; subtitle: string }> = [
  { key: 'NEW', title: 'تفاسير العهد الجديد', subtitle: 'الأناجيل الأربعة، سفر الأعمال، الرسائل الرسولية، وسفر الرؤيا (27 سفراً)' },
  { key: 'OLD', title: 'تفاسير العهد القديم', subtitle: 'أسفار الشريعة، الأسفار التاريخية، الشعرية والحكمة، والأنبياء (39 سفراً)' },
  { key: 'DEUTEROCANON', title: 'تفاسير الأسفار القانونية الثانية', subtitle: 'الأسفار القانونية المعتمدة في الكنيسة الأرثوذكسية (7 أسفار)' },
];

export default async function CommentariesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const testament = queryString(params.testament, 'ALL');

  const data = await fetchServerApi<CommentaryBooksRes>('/api/commentaries/books', 60);

  const totalChaptersInterpreted = data.books.reduce((acc, b) => acc + b._count.commentaries, 0);
  const commentedBooksCount = data.books.filter((b) => b._count.commentaries > 0).length;

  const visibleSections =
    testament === 'ALL'
      ? TESTAMENT_SECTIONS
      : TESTAMENT_SECTIONS.filter((s) => s.key === testament);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1
              className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--accent-burgundy)' }}
            >
              <SectionArtwork name="commentaries" />
              فهرس تفاسير الكتاب المقدس الآبائية
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              شروحات تفصيلية أصحاحاً بأصحاح لأسفار الكتاب المقدس الـ 73 بقلم القمص تادرس يعقوب ملطي (تفسير آبائي) والقمص أنطونيوس فكري، مع ربط كل أصحاح بالشبهات والردود المرتبطة به.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/bible" className="media-action text-xs">
              <SectionIcon name="bible" />
              فهرس الأسفار الكتابي
            </Link>
            <Link href="/apologetics" className="brand-button text-xs">
              <SectionIcon name="shield" />
              الشبهات الكتابية
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <div className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              {data.books.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي الأسفار القانونية</div>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <div className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              {commentedBooksCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>أسفار بها تفاسير مفهرسة</div>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <div className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              {totalChaptersInterpreted}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>أصحاحاً مفسراً بالكامل</div>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <div className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              {data.authors.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>مفسّرون آبائيون معتمدون</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: 'جميع الأسفار' },
            { key: 'NEW', label: 'العهد الجديد' },
            { key: 'OLD', label: 'العهد القديم' },
            { key: 'DEUTEROCANON', label: 'الأسفار القانونية الثانية' },
          ].map((tab) => {
            const active = testament === tab.key;
            return (
              <Link
                key={tab.key}
                href={sectionHref('/commentaries', { testament: tab.key === 'ALL' ? '' : tab.key })}
                className="px-3.5 py-1.5 rounded-full text-xs border font-semibold transition"
                style={{
                  backgroundColor: active ? 'var(--accent-burgundy)' : 'var(--bg-parchment)',
                  color: active ? '#FFFFFF' : 'var(--text-ink)',
                  borderColor: active ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {visibleSections.map((section) => {
        const sectionBooks = data.books.filter((b) => b.testament === section.key);
        return (
          <section key={section.key} className="space-y-4">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border-hairline)' }}>
              <h2 className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                {section.title}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{section.subtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionBooks.map((book) => (
                <div key={book.id} className="card-manuscript p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-scripture text-xl font-bold">
                        <Link href={`/bible/${book.slug}/1#commentary`} className="hover:underline">
                          {book.nameAr}
                        </Link>
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-semibold shrink-0"
                        style={{
                          backgroundColor: 'var(--bg-surface-muted)',
                          color: book._count.commentaries > 0 ? 'var(--accent-burgundy)' : 'var(--text-muted)',
                        }}
                      >
                        {book._count.commentaries} / {book.chaptersCount} أصحاح
                      </span>
                    </div>

                    {book.commentators.length > 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        بقلم: {book.commentators.map((c) => c.name).join(' • ')}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        نص السفر متاح للقراءة والبحث الكتابي
                      </p>
                    )}

                    {book._count.apologeticsRefs > 0 && (
                      <div className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>
                        يرتبط بـ {book._count.apologeticsRefs} ملفات رد على الشبهات
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <Link
                      href={`/bible/${book.slug}/1#commentary`}
                      className="brand-button text-xs flex-1"
                    >
                      {book._count.commentaries > 0 ? 'اقرأ التفسير من الأصحاح 1' : 'تصفّح الأصحاح الأول'}
                    </Link>
                    <Link
                      href={`/bible/${book.slug}`}
                      className="media-action text-xs"
                    >
                      الأصحاحات
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
