import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { SectionIcon } from '@/components/SectionIcon';
import { SectionArtwork, type SectionArtworkName } from '@/components/SectionArtwork';
import { fetchServerApi } from '@/lib/api';
import { CopticCrossIcon } from '@/components/CopticCrossIcon';
import { JsonLd } from '@/components/JsonLd';
import { SermonPlayButton } from '@/components/SermonPlayButton';
import { cairoToday, occasionHref, occasionsForDate, synaxariumReadings } from '@/lib/church-calendar';
import {
  DEFAULT_SEO_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  buildPageMetadata,
  buildWebsiteJsonLd,
  resolveRuntimeOrigin,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: '/',
  absoluteTitle: true,
  keywords: DEFAULT_SEO_KEYWORDS,
});

interface HomeData {
  stats: {
    bibleBooks: number;
    verses: number;
    books: number;
    articles: number;
    commentaries: number;
    sermons: number;
    apologeticsCount?: number;
    synaxariumDaysCount?: number;
  };
  liturgy: {
    gregorianDate: string;
    copticDate: string | null;
    katamerosJson: {
      title?: string | null;
      sections?: Array<{
        id: number;
        title?: string;
        subSections?: Array<{
          id: number;
          title?: string;
          readings?: Array<{ storyId?: number | null; title?: string; displayTitle?: string }>;
        }>;
      }>;
    };
  } | null;
  books: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    coverUrl: string | null;
    format: string;
    author: { name: string };
    category: { name: string };
  }>;
  articles: Array<{
    id: number;
    slug: string;
    title: string;
    summary: string;
    authorName: string | null;
    category: { name: string; type: string };
  }>;
  sermons: Array<{
    id: number;
    slug: string;
    title: string;
    mediaType: string;
    mediaUrl: string;
    durationSeconds: number | null;
    preacher: { name: string };
  }>;
}

async function loadHomeData(): Promise<HomeData> {
  const [statsRes, liturgyRes, booksRes, articlesRes, sermonsRes] = await Promise.allSettled([
    fetchServerApi<HomeData['stats']>('/api/stats', 30),
    fetchServerApi<HomeData['liturgy']>('/api/liturgy/today', 300),
    fetchServerApi<{ items: HomeData['books'] }>('/api/books?pageSize=6', 30),
    fetchServerApi<{ items: HomeData['articles'] }>('/api/explanations?pageSize=6', 30),
    fetchServerApi<{ items: HomeData['sermons'] }>('/api/sermons?pageSize=6', 30),
  ]);

  return {
    stats:
      statsRes.status === 'fulfilled'
        ? statsRes.value
        : { bibleBooks: 0, verses: 0, books: 0, articles: 0, commentaries: 0, sermons: 0 },
    liturgy: liturgyRes.status === 'fulfilled' ? liturgyRes.value : null,
    books: booksRes.status === 'fulfilled' ? booksRes.value.items : [],
    articles: articlesRes.status === 'fulfilled' ? articlesRes.value.items : [],
    sermons: sermonsRes.status === 'fulfilled' ? sermonsRes.value.items : [],
  };
}

const sections: Array<{ icon: SectionArtworkName; href: string; title: string; description: string }> = [
  { icon: 'ai', href: '/ai', title: 'كلم AI الأرثوذكسي', description: 'حوار فوري بالذكاء الاصطناعي في العقيدة والرد على الشبهات.' },
  { icon: 'bible', href: '/bible', title: 'الكتاب المقدس بالتفسير', description: 'اقرأ أسفار العهدين والأسفار القانونية بالتفاسير الآبائية.' },
  { icon: 'apologetics', href: '/apologetics', title: 'الرد على الشبهات', description: 'ملفات دفاعية موثقة للرد على الشبهات اللاهوتية والكتابية.' },
  { icon: 'commentaries', href: '/commentaries', title: 'فهرس تفاسير الأسفار', description: 'شروحات آبائية أصحاحاً بأصحاح لجميع أسفار الكتاب المقدس.' },
  { icon: 'catechism', href: '/catechism', title: 'التعليم العقيدي', description: 'قانون الإيمان، الأسرار السبعة، المجامع المسكونية، واللاهوت المقارن.' },
  { icon: 'library', href: '/library', title: 'المكتبة الأرثوذكسية', description: 'كتب ومخطوطات للقراءة الفورية داخل الموقع والتحميل.' },
  { icon: 'synaxarium', href: '/synaxarium', title: 'السنكسار القبطي', description: 'سير القديسين والشهداء على مدار الـ 13 شهراً قبطياً.' },
  { icon: 'liturgy', href: '/liturgy', title: 'القطمارس والخولاجي والأجبية', description: 'قراءات اليوم، القداسات الثلاثة، التسبحة، والأجبية.' },
  { icon: 'explanations', href: '/explanations', title: 'الشروحات والمقالات', description: 'مقالات وأسئلة عقيدية من تراث قداسة البابا شنودة الثالث.' },
  { icon: 'sermons', href: '/sermons', title: 'مكتبة العظات الصوتية', description: 'استمع إلى العظات والتأملات الأرثوذكسية أثناء التصفح.' },
  { icon: 'videos', href: '/videos', title: 'فيديوهات وشرح', description: 'فيديوهات في الإيمان والتفسير والترانيم والألحان.' },
];

function SectionHeading({ artwork, title, href, link, description }: {
  artwork: SectionArtworkName; title: string; href: string; link: string; description?: string;
}) {
  return (
    <div className="home-section-heading">
      <div>
        <h2><SectionArtwork name={artwork} />{title}</h2>
        {description && <p className="media-muted">{description}</p>}
      </div>
      <Link className="home-more" href={href}>{link}<ArrowLeft size={16} aria-hidden="true" /></Link>
    </div>
  );
}

export default async function HomePage() {
  const today = cairoToday();
  const [origin, { stats, liturgy, books, articles, sermons }, calendar] = await Promise.all([
    resolveRuntimeOrigin(),
    loadHomeData(),
    occasionsForDate(today),
  ]);
  const readings = liturgy?.katamerosJson?.sections?.slice(0, 3) || [];
  const firstStory = synaxariumReadings(readings)[0];
  const counts = [
    { icon: 'book', value: stats.bibleBooks, label: 'سفرًا في الكتاب المقدس', href: '/bible' },
    { icon: 'shield', value: stats.apologeticsCount || 37, label: 'ملفًا للرد على الشبهات', href: '/apologetics' },
    { icon: 'layers', value: stats.books, label: 'كتابًا للقراءة والتحميل', href: '/library' },
    { icon: 'explanations', value: stats.articles + stats.commentaries, label: 'تفسيرًا وشرحًا وسؤالًا', href: '/commentaries' },
  ] as const;

  return (
    <div className="site-shell home-page">
      <JsonLd data={buildWebsiteJsonLd(origin)} />
      <section className="home-top">
        <div className="card-manuscript home-hero">
          <div className="home-hero-art" aria-hidden="true" />
          <div className="home-hero-body">
            <span className="home-hero-label"><SectionIcon name="cross" />بوابة رقمية أرثوذكسية متكاملة</span>
            <h1>كلمة الحياة وتراث الآباء</h1>
            <p className="home-hero-subtitle">في مكتبة عربية موثقة ومفتوحة</p>
            <p className="home-hero-intro">
              اقرأ الكتاب المقدس بالتشكيل مع التفاسير الآبائية، وتصفّح الكتب الأرثوذكسية للقراءة والتحميل، واستمع للعظات وقراءات القطمارس اليومي.
            </p>
            <form className="home-search" action="/search" method="GET">
              <label>
                <SectionIcon name="search" />
                <input type="search" name="q" required aria-label="ابحث في المنارة" placeholder="ابحث عن آية، شبهة، كتاب، قديس أو لحن…" />
              </label>
              <button className="brand-button" type="submit"><SectionIcon name="search" />بحث شامل</button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link href="/ai" className="brand-button text-xs">
                <SectionIcon name="ai" />
                <span>كلم AI الأرثوذكسي الآن</span>
              </Link>
              <Link href="/apologetics" className="media-action text-xs">
                <SectionIcon name="shield" />
                <span>الرد على الشبهات</span>
              </Link>
              <Link href="/ask" className="media-action text-xs">
                <SectionIcon name="ask" />
                <span>اسأل عن شبهة</span>
              </Link>
              <Link href="/about" className="media-action text-xs">
                <SectionIcon name="info" />
                <span>عن المنارة</span>
              </Link>
            </div>
          </div>
          <div className="home-counts" aria-label="محتوى المنارة">
            {counts.map(({ icon, value, label, href }) => (
              <Link href={href} key={href}>
                <SectionIcon name={icon} />
                <strong>{value || '—'}</strong>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="card-manuscript home-liturgy" aria-labelledby="today-heading">
          <div className="home-today-heading">
            <h2 id="today-heading"><SectionArtwork name="calendar" />القطمارس اليومي</h2>
            {liturgy?.copticDate && <bdi className="home-date">{liturgy.copticDate}</bdi>}
          </div>
          <p className="media-muted home-today-date">
            قراءات الكنيسة القبطية الأرثوذكسية {liturgy?.gregorianDate && <>ليوم <bdi>{liturgy.gregorianDate.split('-').reverse().join('-')}</bdi></>}
          </p>
          <ul className="home-readings">
            {calendar.today.slice(0, 3).map((occasion) => (
              <li key={occasion.id}>
                <Link className="home-reading font-bold text-xs" href={occasionHref(occasion, today)}>
                  <SectionIcon name="liturgy" />{occasion.title}
                </Link>
              </li>
            ))}
            {firstStory && (
              <li>
                <Link className="home-reading font-bold text-xs" href="/liturgy#synaxarium">
                  <SectionIcon name="book" />سنكسار اليوم
                </Link>
              </li>
            )}
          </ul>
          <div className="home-readings">
            {readings.length ? readings.map((reading, index) => (
              <Link key={reading.id} href={`/liturgy#reading-${reading.id}`} className="home-reading">
                <SectionIcon name={(['book', 'candle', 'chalice'] as const)[index]} />
                <div>
                  <h3>{reading.title}</h3>
                  {reading.subSections?.slice(0, 3).map((sub) => (
                    <p key={sub.id}>{sub.title ? `${sub.title}: ` : ''}قراءة اليوم</p>
                  ))}
                </div>
              </Link>
            )) : <p className="media-muted">قراءات اليوم غير متاحة حاليًا.</p>}
          </div>
          <div className="home-liturgy-actions">
            <Link href="/liturgy#church-occasions" className="brand-button"><SectionIcon name="book" />القطمارس</Link>
            <Link href="/synaxarium" className="media-action"><SectionIcon name="synaxarium" />السنكسار</Link>
            <Link href="/liturgy#liturgy-date" className="media-action" aria-label="اختيار تاريخ القراءات"><ArrowLeftRight size={16} aria-hidden="true" />التبديل</Link>
          </div>
        </aside>
      </section>

      <nav className="home-shortcuts" aria-label="أقسام المنارة">
        {sections.map(({ icon, href, title, description }) => (
          <Link key={href} className="card-manuscript home-shortcut" href={href}>
            <SectionArtwork name={icon} />
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </nav>

      <section className="home-shelf">
          <SectionHeading artwork="library" title="أحدث كتب المكتبة الأرثوذكسية" href="/library" link="عرض كل الكتب"
          description="أحدث الكتب المضافة للقراءة داخل الموقع والتحميل." />
        {books.length ? (
          <div className="home-books">
            {books.map((book) => {
              const href = `/library/${encodeURIComponent(book.slug)}`;
              return (
                <article key={book.id} className="card-manuscript home-book">
                  <Link href={href} aria-label={book.title} className="home-book-cover">
                    {book.coverUrl ? <img src={book.coverUrl} alt="" loading="lazy" /> : (
                      <><CopticCrossIcon /><span>{book.format === 'HTML_CHAPTERS' ? 'كتاب نصي' : 'كتاب PDF'}</span></>
                    )}
                  </Link>
                  <div className="home-book-info">
                    <p className="home-book-category">{book.category.name}</p>
                    <h3><Link href={href}>{book.title}</Link></h3>
                    <p className="media-muted home-author">{book.author.name}</p>
                    <div className="home-book-actions">
                      <Link href={href + '/read'} className="brand-button"><SectionIcon name="book" />قراءة الآن</Link>
                      <Link href={href} className="media-action">التفاصيل</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <p className="card-manuscript p-4">كتب المكتبة غير متاحة حاليًا. <Link className="underline" href="/videos#books">كتب الدفاع عن الإيمان</Link></p>}
      </section>

      <div className="home-columns">
        <section>
          <SectionHeading artwork="explanations" title="شروحات وأسئلة عقيدية" href="/explanations" link="المزيد" />
          <div className="home-articles">
            {articles.map((article) => (
              <Link key={article.id} className="card-manuscript home-article" href={`/explanations/${encodeURIComponent(article.slug)}`}>
                <SectionIcon name="article" />
                <div>
                  <span>{article.category.name}</span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
          {!articles.length && <p className="media-muted">الشروحات غير متاحة حاليًا.</p>}
        </section>
        <section>
          <SectionHeading artwork="audio" title="أحدث الملفات الصوتية" href="/sermons" link="كل الملفات" />
          <div className="card-manuscript home-sermons">
            {sermons.map((sermon) => (
              <article key={sermon.id} className="home-sermon">
                <SectionIcon name="microphone" />
                <div>
                  <h3>{sermon.title}</h3>
                  <p>{sermon.preacher.name}</p>
                </div>
                <SermonPlayButton slug={sermon.slug} title={sermon.title} preacherName={sermon.preacher.name} mediaUrl={sermon.mediaUrl} />
              </article>
            ))}
            {!sermons.length && <p className="media-muted">العظات غير متاحة حاليًا.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

