import { SectionArtwork } from '@/components/SectionArtwork';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { fetchServerApi, queryString } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = queryString(params.q);
  return buildPageMetadata({
    title: q ? `بحث في آيات الكتاب المقدس: ${q}` : 'الكتاب المقدس الكامل (73 سفراً) بالتشكيل والتفسير',
    description:
      'اقرأ أسفار العهد القديم والعهد الجديد والأسفار القانونية الثانية باللغة العربية المشكّلة مع البحث السريع في الآيات والتفاسير الآبائية.',
    path: '/bible',
    keywords: ['الكتاب المقدس', 'العهد القديم', 'العهد الجديد', 'الأسفار القانونية الثانية', 'بحث في الكتاب المقدس'],
    noIndex: Boolean(q),
  });
}

interface BibleBookItem {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  testament: 'OLD' | 'DEUTEROCANON' | 'NEW';
  chaptersCount: number;
}

export default async function BibleIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = queryString((await searchParams).q);
  const { books } = await fetchServerApi<{ books: BibleBookItem[] }>('/api/bible/books', 300);

  const searchResults =
    q.trim().length >= 2
      ? await fetchServerApi<{
          results: Array<{
            id: number;
            chapter: number;
            verseNumber: number;
            textTashkeel: string;
            book: { slug: string; nameAr: string };
          }>;
        }>(`/api/bible/search?q=${encodeURIComponent(q.trim())}`, 0)
      : null;

  const groups: Array<{ title: string; subtitle: string; items: BibleBookItem[] }> = [
    {
      title: 'العهد القديم',
      subtitle: '39 سفراً — ترجمة سميث وفان دايك بالتشكيل',
      items: books.filter((b) => b.testament === 'OLD'),
    },
    {
      title: 'الأسفار القانونية الثانية',
      subtitle: '7 أسفار معتمدة في الكنيسة القبطية الأرثوذكسية',
      items: books.filter((b) => b.testament === 'DEUTEROCANON'),
    },
    {
      title: 'العهد الجديد',
      subtitle: '27 سفراً — الأناجيل الأربعة وسفر الأعمال والرسائل والرؤيا',
      items: books.filter((b) => b.testament === 'NEW'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-4">
        <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}><SectionArtwork name="bible" />
          الكتاب المقدس الكامل
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          اقرأ أسفار العهدين والأسفار القانونية الثانية، وابحث في الآيات، وتصفّح التفاسير الأرثوذكسية المتوفرة حسب الأصحاح.
        </p>

        <form action="/bible" method="GET" className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="ابحث عن كلمة أو آية في الكتاب المقدس..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            بحث في الآيات
          </button>
        </form>
      </div>

      {searchResults && (
        <section className="card-manuscript p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg">
              نتائج البحث عن &quot;{q}&quot; ({searchResults.results.length})
            </h2>
            <Link href="/bible" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
              إغلاق نتائج البحث
            </Link>
          </div>
          {searchResults.results.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              لم يتم العثور على آيات مطابقة. جرب كلمة أخرى.
            </p>
          ) : (
            <div className="space-y-3">
              {searchResults.results.map((v) => (
                <Link
                  key={v.id}
                  href={`/bible/${v.book.slug}/${v.chapter}#verse-${v.verseNumber}`}
                  className="block p-3.5 rounded-lg border hover:border-[#B68A35] transition"
                  style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: 'var(--accent-burgundy)' }}>
                    {v.book.nameAr} {v.chapter}: {v.verseNumber}
                  </div>
                  <p className="font-scripture text-lg leading-relaxed">{v.textTashkeel}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="space-y-8">
        {groups.map((grp) => (
          <section key={grp.title} className="space-y-3">
            <div>
              <h2 className="font-scripture text-2xl font-bold">{grp.title}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{grp.subtitle}</p>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {grp.items.map((book) => (
                <Link
                  key={book.id}
                  href={`/bible/${book.slug}/1`}
                  className="card-manuscript p-3.5 hover:border-[#B68A35] transition flex flex-col justify-between"
                >
                  <div className="font-bold text-sm">{book.nameAr}</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {book.chaptersCount} أصحاح
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
