import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError, fetchServerApi, type ApologeticsSummaryDto } from '@/lib/api';
import { BibleChapterReader } from '@/components/BibleChapterReader';
import { JsonLd } from '@/components/JsonLd';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  resolveRuntimeOrigin,
} from '@/lib/seo';

interface BibleChapterApiResponse {
  book: { slug: string; nameAr: string; chaptersCount: number };
  chapter: number;
  verses: Array<{ id: number; verseNumber: number; textTashkeel: string }>;
  commentaries: Array<{
    id: number;
    title: string;
    contentHtml: string;
    sourceName: string;
    sourceUrl: string;
    author: { name: string };
  }>;
  apologetics?: ApologeticsSummaryDto[];
}

export async function buildBibleChapterMetadata(slug: string, chapter: number): Promise<Metadata> {
  if (!Number.isSafeInteger(chapter) || chapter < 1) notFound();

  try {
    const data = await fetchServerApi<BibleChapterApiResponse>(
      `/api/bible/books/${encodeURIComponent(slug)}/chapters/${chapter}`,
      60,
    );
    const preview = data.verses
      .slice(0, 2)
      .map((v) => v.textTashkeel)
      .join(' ');
    return buildPageMetadata({
      title: `سفر ${data.book.nameAr} - الأصحاح ${data.chapter}`,
      description: `قراءة وتفسير ${data.book.nameAr} الأصحاح ${data.chapter}: ${preview}`,
      path: `/bible/${encodeURIComponent(data.book.slug)}/${data.chapter}`,
      type: 'article',
      keywords: [
        `سفر ${data.book.nameAr}`,
        `${data.book.nameAr} ${data.chapter}`,
        `تفسير ${data.book.nameAr} ${data.chapter}`,
        'الكتاب المقدس',
      ],
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function BibleChapterScreen({ slug, chapter }: { slug: string; chapter: number }) {
  if (!Number.isSafeInteger(chapter) || chapter < 1) notFound();

  try {
    const [data, origin] = await Promise.all([
      fetchServerApi<BibleChapterApiResponse>(
        `/api/bible/books/${encodeURIComponent(slug)}/chapters/${chapter}`,
        60,
      ),
      resolveRuntimeOrigin(),
    ]);

    const chapterPath = `/bible/${encodeURIComponent(data.book.slug)}/${data.chapter}`;
    const preview = data.verses
      .slice(0, 2)
      .map((v) => v.textTashkeel)
      .join(' ');

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <JsonLd
          data={[
            buildBreadcrumbJsonLd(origin, [
              { name: 'الرئيسية', path: '/' },
              { name: 'الكتاب المقدس', path: '/bible' },
              { name: `${data.book.nameAr} ${data.chapter}`, path: chapterPath },
            ]),
            buildArticleJsonLd(origin, {
              headline: `${data.book.nameAr} - الأصحاح ${data.chapter}`,
              description: preview || `النص الكامل والتفسير لسفر ${data.book.nameAr} الأصحاح ${data.chapter}`,
              path: chapterPath,
              section: `الكتاب المقدس - ${data.book.nameAr}`,
            }),
          ]}
        />
        <BibleChapterReader
          key={`${data.book.slug}-${data.chapter}`}
          book={data.book}
          chapter={data.chapter}
          verses={data.verses}
          commentaries={data.commentaries}
          apologetics={data.apologetics || []}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
