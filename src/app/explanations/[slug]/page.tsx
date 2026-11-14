import { SectionIcon } from '@/components/SectionIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ApiError, fetchServerApi } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface ArticleRes {
  article: {
    id: number;
    title: string;
    contentHtml: string;
    tags: string[];
    authorName: string | null;
    sourceName: string;
    sourceUrl: string;
    viewsCount: number;
    category: { name: string; slug: string };
  };
}

export default async function ExplanationArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { notFound(); }

  let data: ArticleRes;
  try {
    data = await fetchServerApi<ArticleRes>(`/api/explanations/${encodeURIComponent(slug)}`, 60);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { article } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="card-manuscript p-6 md:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            href={`/explanations?category=${encodeURIComponent(article.category.slug)}`}
            className="inline-flex items-center gap-1 font-semibold hover:underline"
            style={{ color: 'var(--accent-burgundy)' }}
          >
            <ArrowRight className="w-4 h-4" />
            <span>{article.category.name}</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>{article.viewsCount} قراءة</span>
        </div>

        <header className="space-y-2 pb-5 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold leading-snug"><SectionIcon name="article" />
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {article.authorName && (
              <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                {article.authorName}
              </span>
            )}
            <span>المصدر: {article.sourceName}</span>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>الرابط الأصلي</span>
            </a>
          </div>
        </header>

        <div
          className="prose-arabic text-base"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </article>
    </div>
  );
}
