import { SectionArtwork } from '@/components/SectionArtwork';
import Link from 'next/link';
import { BookOpen, Download, Search } from 'lucide-react';
import { fetchServerApi, formatBytes, queryString, sectionHref } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

interface LibraryResponse {
  items: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    coverUrl: string | null;
    format: string;
    fileSizeBytes: number | null;
    downloadsCount: number;
    sourceSite: string;
    author: { name: string; slug: string };
    category: { name: string; slug: string };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

interface MetaResponse {
  categories: Array<{ id: number; name: string; slug: string; _count: { books: number } }>;
  authors: Array<{ id: number; name: string; slug: string; _count: { books: number } }>;
  totalBooks: number;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = queryString(params.q);
  const category = queryString(params.category);
  const author = queryString(params.author);
  const format = queryString(params.format);
  const sort = queryString(params.sort, 'latest');
  const page = queryString(params.page, '1');

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (category) qs.set('category', category);
  if (author) qs.set('author', author);
  if (format) qs.set('format', format);
  if (sort) qs.set('sort', sort);
  qs.set('page', page);

  const [booksData, metaData] = await Promise.all([
    fetchServerApi<LibraryResponse>(`/api/books?${qs.toString()}`, 0),
    fetchServerApi<MetaResponse>('/api/books/meta', 0),
  ]);


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}><SectionArtwork name="library" />
              مكتبة الكتب المسيحية الأرثوذكسية
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {metaData.totalBooks} كتاباً ومخطوطاً جاهزاً للقراءة الفورية داخل الموقع والتحميل المباشر
            </p>
          </div>
          <Link
            href="/videos#books"
            className="px-4 py-2 rounded-lg border text-xs font-semibold"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            أهم ١٠ كتب للرد والدفاع
          </Link>
        </div>

        <form action="/library" method="GET" className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4 relative">
            <input
              type="search"
              aria-label="ابحث عن كتاب"
              name="q"
              defaultValue={q}
              placeholder="ابحث باسم الكتاب أو المؤلف..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          <select
            name="author"
            aria-label="المؤلف"
            defaultValue={author}
            className="md:col-span-3 rounded-lg border px-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            <option value="">كل المؤلفين</option>
            {metaData.authors?.map((a) => (
              <option key={a.id} value={a.slug}>
                {a.name} ({a._count.books})
              </option>
            ))}
          </select>
          <select
            name="format"
            aria-label="صيغة الكتاب"
            defaultValue={format}
            className="md:col-span-2 rounded-lg border px-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            <option value="">كل الصيغ</option>
            <option value="PDF">كتب PDF</option>
            <option value="HTML_CHAPTERS">كتب مقروءة بالفصول</option>
          </select>
          <select
            name="sort"
            aria-label="ترتيب الكتب"
            defaultValue={sort}
            className="md:col-span-2 rounded-lg border px-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            <option value="latest">الأحدث إضافة</option>
            <option value="popular">الأكثر تحميلاً</option>
          </select>
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="md:col-span-1 rounded-lg text-sm font-semibold text-white py-2.5"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            تصفية
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Link
            href={sectionHref('/library', { q, author, format, sort })}
            aria-current={!category ? 'page' : undefined}
            className="px-3 py-1.5 rounded-full text-xs border transition"
            style={{
              backgroundColor: !category ? 'var(--accent-burgundy)' : 'transparent',
              color: !category ? '#FFFFFF' : 'var(--text-ink)',
              borderColor: !category ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
            }}
          >
            الكل ({metaData.totalBooks})
          </Link>
          {metaData.categories.map((cat) => {
            const active = category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={sectionHref('/library', { q, author, format, sort, category: cat.slug })}
                aria-current={active ? 'page' : undefined}
                className="px-3 py-1.5 rounded-full text-xs border transition"
                style={{
                  backgroundColor: active ? 'var(--accent-burgundy)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--text-ink)',
                  borderColor: active ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                }}
              >
                {cat.name} ({cat._count.books})
              </Link>
            );
          })}
        </div>
      </div>

      {booksData.items.length === 0 ? (
        <div className="card-manuscript p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          لا توجد كتب مطابقة لبحثك حالياً. <Link href="/library" className="underline">امسح التصفية</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {booksData.items.map((book) => (
            <div key={book.id} className="card-manuscript p-5 flex flex-col justify-between gap-4">
              <div className="flex gap-4">
                <div
                  className="w-24 h-32 rounded-lg shrink-0 overflow-hidden border flex items-center justify-center p-2 text-center"
                  style={{ backgroundColor: 'var(--bg-surface-muted)', borderColor: 'var(--border-hairline)' }}
                >
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-scripture text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                      {book.category.name}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-gold)' }}>
                    {book.category.name}
                  </span>
                  <Link href={`/library/${encodeURIComponent(book.slug)}`}>
                    <h2 className="font-bold text-base line-clamp-2 hover:underline">{book.title}</h2>
                  </Link>
                  <Link href={`/authors/${encodeURIComponent(book.author.slug)}`} className="text-xs truncate block hover:underline" style={{ color: 'var(--text-muted)' }}>
                    {book.author.name}
                  </Link>
                  <div className="text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                    {book.sourceSite} {book.fileSizeBytes ? `• ${formatBytes(book.fileSizeBytes)}` : ''}
                  </div>
                </div>
              </div>

              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {book.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                <Link
                  href={`/library/${encodeURIComponent(book.slug)}/read`}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--accent-burgundy)' }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>اقرأ داخل الموقع</span>
                </Link>
                  <a
                    href={`/library/${encodeURIComponent(book.slug)}/file/download`}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{book.format === 'HTML_CHAPTERS' ? 'تحميل نسخة نصية' : 'تحميل PDF'}</span>
                  </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination path="/library" filters={{ q, category, author, format, sort }} page={booksData.page} totalPages={booksData.totalPages} />
    </div>
  );
}
