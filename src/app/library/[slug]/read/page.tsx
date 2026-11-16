import { SectionIcon } from '@/components/SectionIcon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ApiError, fetchServerApi } from '@/lib/api';
import { PdfBookReader } from '@/components/PdfBookReader';
import { ChapterBookReader } from '@/components/ChapterBookReader';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface BookReaderData {
  book: {
    slug: string;
    title: string;
    description?: string;
    format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
    author: { name: string };
    chapters: Array<{ chapterNumber: number; title: string }>;
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { notFound(); }

  try {
    const { book } = await fetchServerApi<BookReaderData>(`/api/books/${encodeURIComponent(slug)}`, 0);
    return buildPageMetadata({
      title: `قراءة كتاب ${book.title} - ${book.author.name}`,
      description: book.description || `قراءة كتاب ${book.title} تأليف ${book.author.name} مباشرة عبر قارئ المنارة الأرثوذكسية.`,
      path: `/library/${encodeURIComponent(book.slug)}/read`,
      type: 'book',
      noIndex: book.format !== 'HTML_CHAPTERS',
      keywords: [book.title, book.author.name, 'قراءة كتب أرثوذكسية'],
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function BookReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { notFound(); }

  let data: BookReaderData;
  try {
    data = await fetchServerApi<BookReaderData>(`/api/books/${encodeURIComponent(slug)}`, 0);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { book } = data;
  const { chapter } = await searchParams;
  const initialChapter = book.chapters.find((item) => String(item.chapterNumber) === chapter)?.chapterNumber
    ?? book.chapters[0]?.chapterNumber;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {book.format === 'HTML_CHAPTERS' ? initialChapter !== undefined ? (
        <ChapterBookReader
          key={initialChapter}
          slug={book.slug}
          title={book.title}
          authorName={book.author.name}
          chapters={book.chapters}
          initialChapter={initialChapter}
        />
      ) : <div className="card-manuscript p-6 space-y-2">
        <h1 className="section-page-title font-bold"><SectionIcon name="book" />{book.title}</h1>
        <p>فصول هذا الكتاب غير متاحة للقراءة داخل الموقع حاليًا.</p>
        <Link className="media-action" href={`/library/${encodeURIComponent(book.slug)}`}>صفحة الكتاب والمصدر</Link>
      </div> : (
        <PdfBookReader
          slug={book.slug}
          title={book.title}
          authorName={book.author.name}
        />
      )}
    </div>
  );
}
