import { SectionIcon } from '@/components/SectionIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { ApiError, fetchServerApi, formatBytes } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface BookDetailResponse {
  book: {
    id: number;
    slug: string;
    title: string;
    description: string;
    coverUrl: string | null;
    format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
    pageCount: number | null;
    fileSizeBytes: number | null;
    sourceSite: string;
    sourcePageUrl: string;
    downloadsCount: number;
    viewsCount: number;
    author: { name: string; slug: string };
    category: { name: string; slug: string };
    chapters: Array<{ id: number; chapterNumber: number; title: string }>;
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { notFound(); }

  let data: BookDetailResponse;
  try {
    data = await fetchServerApi<BookDetailResponse>(`/api/books/${encodeURIComponent(slug)}`, 0);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { book } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript p-6 md:p-8 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <div
            className="aspect-[3/4] rounded-xl overflow-hidden border flex items-center justify-center p-4 text-center"
            style={{ backgroundColor: 'var(--bg-surface-muted)', borderColor: 'var(--border-hairline)' }}
          >
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <span className="font-scripture text-xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                {book.title}
              </span>
            )}
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`/library?category=${encodeURIComponent(book.category.slug)}`}
                className="px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
              >
                {book.category.name}
              </Link>
              <span style={{ color: 'var(--text-muted)' }}>• {book.sourceSite}</span>
            </div>

            <h1 className="section-page-title font-scripture text-3xl font-bold"><SectionIcon name="book" />{book.title}</h1>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
              تأليف / إعداد:{' '}
              <Link href={`/authors/${encodeURIComponent(book.author.slug)}`} className="underline hover:opacity-80">
                {book.author.name}
              </Link>
            </p>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              {book.description}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)' }}>
                <div style={{ color: 'var(--text-muted)' }}>الصيغة</div>
                <div className="font-bold mt-0.5">{book.format === 'HTML_CHAPTERS' ? 'فصول نصية' : 'PDF'}</div>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)' }}>
                <div style={{ color: 'var(--text-muted)' }}>الحجم / الفصول</div>
                <div className="font-bold mt-0.5">
                  {book.format === 'HTML_CHAPTERS'
                    ? `${book.chapters.length} فصول`
                    : formatBytes(book.fileSizeBytes)}
                </div>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-hairline)' }}>
                <div style={{ color: 'var(--text-muted)' }}>المشاهدات والتحميلات</div>
                <div className="font-bold mt-0.5">{book.viewsCount} / {book.downloadsCount}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
            <Link
              href={`/library/${encodeURIComponent(book.slug)}/read`}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent-burgundy)' }}
            >
              <BookOpen className="w-4 h-4" />
              <span>افتح واقرأ الكتاب داخل الموقع</span>
            </Link>

              <a
                href={`/library/${encodeURIComponent(book.slug)}/file/download`}
                className="px-5 py-3 rounded-lg border text-sm font-semibold flex items-center gap-2"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Download className="w-4 h-4" />
                <span>{book.format === 'HTML_CHAPTERS' ? 'تحميل نسخة نصية للقراءة' : 'تحميل PDF'}</span>
              </a>

            {book.sourcePageUrl.startsWith('http') && (
              <a
                href={book.sourcePageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 text-xs flex items-center gap-1 underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>المصدر الأصلي</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {book.chapters.length > 0 && (
        <section className="card-manuscript p-6 space-y-4">
          <h2 className="font-scripture text-2xl font-bold">فهرس فصول الكتاب</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {book.chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/library/${encodeURIComponent(book.slug)}/read?chapter=${ch.chapterNumber}`}
                className="p-3 rounded-lg border text-sm hover:border-[#B68A35] transition"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                {ch.chapterNumber}. {ch.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
