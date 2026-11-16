import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Download } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { SectionIcon } from '@/components/SectionIcon';
import { ApiError, fetchServerApi, formatBytes, getPublicApiBase } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildProfileJsonLd,
  resolveRuntimeOrigin,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface AuthorProfileRes {
  author: {
    id: number;
    name: string;
    slug: string;
    bio: string | null;
  };
  books: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    coverUrl: string | null;
    format: string;
    fileSizeBytes: number | null;
    sourceSite: string;
    category: { name: string; slug: string };
  }>;
}

async function loadAuthorProfile(rawSlug: string): Promise<AuthorProfileRes> {
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    notFound();
  }

  try {
    return await fetchServerApi<AuthorProfileRes>(`/api/authors/${encodeURIComponent(slug)}`, 60);
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
  const { author, books } = await loadAuthorProfile(slug);
  return buildPageMetadata({
    title: `${author.name} - مؤلفات وكتب (${books.length})`,
    description: author.bio || `تصفح واقرأ كتب ومؤلفات ${author.name} المتوفرة في مكتبة المنارة الأرثوذكسية (${books.length} كتاباً).`,
    path: `/authors/${encodeURIComponent(author.slug)}`,
    type: 'profile',
    keywords: [author.name, `كتب ${author.name}`, 'المكتبة القبطية'],
  });
}

export default async function AuthorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const [data, origin] = await Promise.all([
    loadAuthorProfile(rawSlug),
    resolveRuntimeOrigin(),
  ]);

  const { author, books } = data;
  const publicApi = getPublicApiBase();
  const authorPath = `/authors/${encodeURIComponent(author.slug)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <JsonLd
        data={[
          buildBreadcrumbJsonLd(origin, [
            { name: 'الرئيسية', path: '/' },
            { name: 'المكتبة', path: '/library' },
            { name: author.name, path: authorPath },
          ]),
          buildProfileJsonLd(origin, {
            name: author.name,
            description: author.bio || `مؤلف في مكتبة المنارة الأرثوذكسية (${books.length} كتاباً)`,
            path: authorPath,
            jobTitle: 'مؤلف وباحث لاهوتي قبطي أرثوذكسي',
          }),
        ]}
      />
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:underline">الرئيسية</Link>
          <span>/</span>
          <Link href="/library" className="hover:underline">المكتبة</Link>
          <span>/</span>
          <span>{author.name}</span>
        </div>
        <Link href="/library" className="inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--accent-burgundy)' }}>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للمكتبة</span>
        </Link>
      </div>

      <section className="card-manuscript section-page-banner p-6 md:p-8 space-y-3">
        <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
          <SectionIcon name="library" />
          {author.name}
        </h1>
        {author.bio ? (
          <p className="text-sm leading-7 max-w-3xl" style={{ color: 'var(--text-muted)' }}>{author.bio}</p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            مؤلفات ودراسات أرثوذكسية متاحة للقراءة والتحميل داخل المنارة الأرثوذكسية.
          </p>
        )}
        <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
          إجمالي المؤلفات المفهرسة: {books.length} كتاباً
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <article key={book.id} className="card-manuscript p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <Link
                  href={`/library?category=${encodeURIComponent(book.category.slug)}`}
                  className="px-2.5 py-0.5 rounded-full hover:underline"
                  style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
                >
                  {book.category.name}
                </Link>
                <span style={{ color: 'var(--text-muted)' }}>
                  {book.format === 'HTML_CHAPTERS' ? 'فصول نصية' : formatBytes(book.fileSizeBytes)}
                </span>
              </div>

              <h2 className="font-scripture text-lg font-bold leading-snug">
                <Link href={`/library/${book.slug}`} className="hover:underline">
                  {book.title}
                </Link>
              </h2>

              <p className="text-xs leading-6 line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                {book.description}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              <Link href={`/library/${book.slug}`} className="brand-button text-xs flex-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>قراءة الكتاب</span>
              </Link>
              <a
                href={`${publicApi}/api/books/${encodeURIComponent(book.slug)}/download`}
                className="media-action text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
