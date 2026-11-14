import { notFound } from 'next/navigation';
import { ApiError, fetchServerApi, type ApologeticsSummaryDto } from '@/lib/api';
import { BibleChapterReader } from '@/components/BibleChapterReader';

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

export async function BibleChapterScreen({ slug, chapter }: { slug: string; chapter: number }) {
  if (!Number.isSafeInteger(chapter) || chapter < 1) notFound();

  try {
    const data = await fetchServerApi<BibleChapterApiResponse>(
      `/api/bible/books/${encodeURIComponent(slug)}/chapters/${chapter}`,
      60,
    );

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
