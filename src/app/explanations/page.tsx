import { SectionArtwork } from '@/components/SectionArtwork';
import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import { fetchServerApi, queryString, sectionHref } from '@/lib/api';
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
    title: q ? `البحث في الشروحات والمقالات: ${q}` : 'الشروحات والمقالات اللاهوتية والروحية',
    description:
      'مقالات وأسئلة عقيدية وروحية وطقسية من تراث قداسة البابا شنودة الثالث وآباء الكنيسة القبطية الأرثوذكسية وتفاسير الأصحاحات.',
    path: '/explanations',
    keywords: ['شروحات أرثوذكسية', 'مقالات البابا شنودة الثالث', 'أسئلة لاهوتية', 'اللاهوت الطقسي'],
    noIndex: Boolean(q),
  });
}

interface ExplanationsRes {
  items: Array<{
    id: number;
    slug: string;
    title: string;
    summary: string;
    authorName: string | null;
    sourceName: string;
    category: { name: string; slug: string; type: string };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

interface CategoriesRes {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    type: string;
    description?: string | null;
    _count: { articles: number };
  }>;
}

interface CommentariesRes {
  items: Array<{
    id: number;
    chapter: number;
    title: string;
    author: { name: string };
    book: { slug: string; nameAr: string };
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  QA: 'سؤال وجواب',
  DOGMA: 'العقيدة واللاهوت',
  RITES: 'الطقوس والأعياد',
  PATROLOGY: 'الآباء والقديسون',
  SPIRITUAL: 'الحياة الروحية',
  COMMENTARY: 'شروحات كتابية',
};

export default async function ExplanationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = queryString(params.q), category = queryString(params.category), type = queryString(params.type);
  const page = queryString(params.page, '1');
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (category) qs.set('category', category);
  if (type) qs.set('type', type);
  qs.set('page', page);

  const [articlesData, catData, commentariesData] = await Promise.all([
    fetchServerApi<ExplanationsRes>(`/api/explanations?${qs.toString()}`, 30),
    fetchServerApi<CategoriesRes>('/api/explanations/categories', 60),
    fetchServerApi<CommentariesRes>('/api/commentaries?pageSize=8', 60),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}><SectionArtwork name="explanations" />
          قسم الشروحات والتفاسير والأسئلة العقيدية
        </h1>
        <p className="text-sm max-w-3xl" style={{ color: 'var(--text-muted)' }}>
          موسوعة متكاملة للردود العقيدية، الأسئلة الكتابية والشبهات، شرح الطقوس الكنسية، كتابات قداسة البابا شنودة الثالث، وتفاسير الكتاب المقدس للآباء.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/apologetics" className="brand-button text-xs">موسوعة الرد على الشبهات</Link>
          <Link href="/catechism" className="media-action text-xs">التعليم العقيدي المنظم</Link>
          <Link href="/commentaries" className="media-action text-xs">فهرس تفاسير الـ 73 سفراً</Link>
          <Link href="/videos?category=bible#watch" className="media-action text-xs">شاهد التفاسير المصوّرة</Link>
        </div>

        <form action="/explanations" method="GET" className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              aria-label="ابحث في الشروحات"
              name="q"
              defaultValue={q}
              placeholder="ابحث عن شرح آية، عقيدة، طقس، أو سؤال..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          {type && <input type="hidden" name="type" value={type} />}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            بحث
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Link
            href={sectionHref('/explanations', { q })}
            aria-current={!category && !type ? 'page' : undefined}
            className="px-3 py-1.5 rounded-full text-xs border"
            style={{
              backgroundColor: !category && !type ? 'var(--accent-burgundy)' : 'transparent',
              color: !category && !type ? '#FFFFFF' : 'var(--text-ink)',
              borderColor: !category && !type ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
            }}
          >
            كل الشروحات
          </Link>
          {Object.entries(TYPE_LABELS).map(([k, label]) => (
            <Link
              key={k}
              href={sectionHref('/explanations', { q, type: k })}
              aria-current={type === k && !category ? 'page' : undefined}
              className="px-3 py-1.5 rounded-full text-xs border"
              style={{
                backgroundColor: type === k ? 'var(--accent-burgundy)' : 'transparent',
                color: type === k ? '#FFFFFF' : 'var(--text-ink)',
                borderColor: type === k ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {catData.categories.map((cat) => (
            <Link
              key={cat.id}
              href={sectionHref('/explanations', { q, category: cat.slug })}
              aria-current={category === cat.slug ? 'page' : undefined}
              className="px-2.5 py-1 rounded text-xs border"
              style={{
                backgroundColor: category === cat.slug ? 'var(--bg-surface-muted)' : 'transparent',
                borderColor: 'var(--border-hairline)',
              }}
            >
              {cat.name} ({cat._count.articles})
            </Link>
          ))}
        </div>
        {category && (() => {
          const activeCat = catData.categories.find((c) => c.slug === category);
          return activeCat?.description ? (
            <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
              {activeCat.description}
            </p>
          ) : null;
        })()}
      </div>

      {/* Linked Bible Commentaries Strip */}
      {commentariesData.items.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-scripture text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-burgundy)' }} />
            <span>تفاسير أصحاحات الكتاب المقدس (مربوطة مباشرة بالنص الكتابي)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {commentariesData.items.map((c) => (
              <Link
                key={c.id}
                href={`/bible/${c.book.slug}/${c.chapter}#commentary`}
                className="card-manuscript p-4 hover:border-[#B68A35] transition"
              >
                <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {c.book.nameAr} — الأصحاح {c.chapter}
                </div>
                <h3 className="font-bold text-sm mt-1 line-clamp-2">{c.title}</h3>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {c.author.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="space-y-4">
        {articlesData.items.length === 0 ? (
          <div className="card-manuscript p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            لا توجد مقالات أو شروحات مطابقة حالياً. <Link href="/explanations" className="underline">امسح التصفية</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articlesData.items.map((art) => (
              <Link
                key={art.id}
                href={`/explanations/${encodeURIComponent(art.slug)}`}
                className="card-manuscript p-5 hover:border-[#B68A35] transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--accent-burgundy)' }}>
                      {art.category.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{art.sourceName}</span>
                  </div>
                  <h3 className="font-bold text-lg">{art.title}</h3>
                  <p className="text-sm line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {art.summary}
                  </p>
                </div>
                {art.authorName && (
                  <div className="text-xs font-medium pt-2 border-t" style={{ borderColor: 'var(--border-hairline)', color: 'var(--accent-gold)' }}>
                    {art.authorName}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <Pagination path="/explanations" filters={{ q, category, type }} page={articlesData.page} totalPages={articlesData.totalPages} />
      </section>
    </div>
  );
}
