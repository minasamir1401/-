'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, WifiOff } from 'lucide-react';
import {
  listSavedBooksOffline,
  readOfflineApologetic,
  readOfflineApologeticsList,
  readOfflineBibleChapter,
  readOfflineCore,
  readOfflineExplanation,
  readOfflineExplanationsList,
  readOfflineSavedBookChapters,
  readOfflineSynaxarium,
  type OfflineApologeticsEntry,
  type OfflineBibleBook,
  type OfflineBookCatalogItem,
  type OfflineCommentaryItem,
  type OfflineExplanationArticle,
  type OfflineSavedBook,
  type OfflineSynaxariumEntry,
} from '@/lib/offline-store';
import { PdfBookReader } from './PdfBookReader';
import { ChapterBookReader } from './ChapterBookReader';
import { usePwa } from './PwaProvider';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'not-synced' }
  | { kind: 'bible-chapter'; book: OfflineBibleBook; chapter: number; verses: Array<[number, string]>; commentaries: OfflineCommentaryItem[] }
  | { kind: 'apologetics-detail'; entry: OfflineApologeticsEntry }
  | { kind: 'apologetics-list'; items: Array<Omit<OfflineApologeticsEntry, 'answerHtml' | 'sourcesJson' | 'orderIndex'>> }
  | { kind: 'explanation-detail'; article: OfflineExplanationArticle }
  | { kind: 'explanations-list'; items: Array<Omit<OfflineExplanationArticle, 'contentHtml' | 'tags' | 'sourceUrl' | 'viewsCount'>> }
  | { kind: 'synaxarium'; entries: OfflineSynaxariumEntry[] }
  | { kind: 'book-read-pdf'; book: OfflineSavedBook }
  | { kind: 'book-read-html'; book: OfflineSavedBook; chapters: Array<{ chapterNumber: number; title: string; contentHtml: string }> }
  | { kind: 'book-not-saved'; catalogBook: OfflineBookCatalogItem | null; savedBooks: OfflineSavedBook[] }
  | { kind: 'hub'; bibleBooks: OfflineBibleBook[]; savedBooks: OfflineSavedBook[]; totalApol: number; totalExp: number };

export function OfflineReaderClient() {
  const { isOnline, startOfflineSync, offlineBusy, offlineProgress } = usePwa();
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const [filterQ, setFilterQ] = useState('');

  useEffect(() => {
    async function resolveRoute() {
      const path = decodeURIComponent(window.location.pathname);
      const sp = new URLSearchParams(window.location.search);

      const core = await readOfflineCore();
      const savedBooks = await listSavedBooksOffline();

      const bibleMatch = path.match(/^\/bible\/([^/]+)(?:\/(\d+))?$/);
      if (bibleMatch) {
        const res = await readOfflineBibleChapter(bibleMatch[1], Number(bibleMatch[2] || '1'));
        if (res) {
          setState({ kind: 'bible-chapter', ...res });
          return;
        }
      }

      const apolDetail = path.match(/^\/apologetics\/([^/]+)$/);
      if (apolDetail) {
        const entry = await readOfflineApologetic(apolDetail[1]);
        if (entry) {
          setState({ kind: 'apologetics-detail', entry });
          return;
        }
      }

      if (path === '/apologetics') {
        const items = await readOfflineApologeticsList();
        const domain = sp.get('domain');
        if (items.length) {
          setState({
            kind: 'apologetics-list',
            items: domain && domain !== 'all' ? items.filter((i) => i.domain === domain) : items,
          });
          return;
        }
      }

      const expDetail = path.match(/^\/explanations\/([^/]+)$/);
      if (expDetail) {
        const article = await readOfflineExplanation(expDetail[1]);
        if (article) {
          setState({ kind: 'explanation-detail', article });
          return;
        }
      }

      if (path === '/explanations') {
        const items = await readOfflineExplanationsList();
        if (items.length) {
          setState({ kind: 'explanations-list', items });
          return;
        }
      }

      if (path === '/synaxarium') {
        const entries = await readOfflineSynaxarium();
        if (entries.length) {
          setState({ kind: 'synaxarium', entries });
          return;
        }
      }

      const libMatch = path.match(/^\/library\/([^/]+)(?:\/(read))?$/);
      if (libMatch) {
        const slug = libMatch[1];
        const saved = savedBooks.find((b) => b.slug === slug);
        if (saved && libMatch[2] === 'read') {
          if (saved.format === 'HTML_CHAPTERS') {
            const chapters = await readOfflineSavedBookChapters(slug);
            setState({ kind: 'book-read-html', book: saved, chapters });
            return;
          }
          setState({ kind: 'book-read-pdf', book: saved });
          return;
        }
        const catalogBook = core?.books?.find((b) => b.slug === slug) || null;
        if (saved) {
          setState(
            saved.format === 'HTML_CHAPTERS'
              ? { kind: 'book-read-html', book: saved, chapters: await readOfflineSavedBookChapters(slug) }
              : { kind: 'book-read-pdf', book: saved },
          );
          return;
        }
        setState({ kind: 'book-not-saved', catalogBook, savedBooks });
        return;
      }

      if (!core) {
        setState({ kind: 'not-synced' });
        return;
      }

      const [apolList, expList] = await Promise.all([readOfflineApologeticsList(), readOfflineExplanationsList()]);
      setState({
        kind: 'hub',
        bibleBooks: core.bibleBooks || [],
        savedBooks,
        totalApol: apolList.length,
        totalExp: expList.length,
      });
    }

    void resolveRoute();
  }, []);

  if (state.kind === 'loading') {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center">جاري التحميل من الذاكرة المحلية...</div>;
  }

  if (state.kind === 'not-synced') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-manuscript p-8 text-center space-y-4">
          <WifiOff className="w-10 h-10 mx-auto" style={{ color: 'var(--accent-burgundy)' }} />
          <h1 className="font-scripture text-2xl font-bold">أنت حالياً بدون اتصال بالإنترنت</h1>
          <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
            لم يتم تحميل محتوى الموقع أوفلاين على هذا الجهاز بعد. عندما يتوفر الإنترنت، اضغط «حفظ أوفلاين» من الشريط العلوي لقراءة الكتاب المقدس والشبهات والتفاسير والشروحات والسنكسار بدون نت.
          </p>
          {isOnline && (
            <button type="button" onClick={() => void startOfflineSync()} disabled={offlineBusy} className="brand-button">
              {offlineBusy ? `جاري الحفظ ${offlineProgress}%` : 'حفظ محتوى الموقع أوفلاين الآن'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state.kind === 'bible-chapter') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="card-manuscript p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}>
                قراءة أوفلاين
              </span>
              <h1 className="font-scripture text-3xl font-bold mt-2">
                {state.book.nameAr} — الأصحاح {state.chapter}
              </h1>
            </div>
            <div className="flex gap-2 text-xs">
              {state.chapter > 1 && (
                <a href={`/bible/${state.book.slug}/${state.chapter - 1}`} className="media-action">
                  الأصحاح السابق
                </a>
              )}
              {state.chapter < state.book.chaptersCount && (
                <a href={`/bible/${state.book.slug}/${state.chapter + 1}`} className="brand-button">
                  الأصحاح التالي
                </a>
              )}
            </div>
          </div>

          <div className="space-y-3 text-lg leading-loose font-scripture pt-3 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
            {state.verses.map(([n, text]) => (
              <p key={n}>
                <strong style={{ color: 'var(--accent-burgundy)' }}>{n} </strong>
                {text}
              </p>
            ))}
          </div>
        </div>

        {state.commentaries.length > 0 && (
          <div className="card-manuscript p-6 space-y-4">
            <h2 className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              تفاسير الأصحاح ({state.commentaries.length})
            </h2>
            {state.commentaries.map((c) => (
              <article key={c.id} className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
                <h3 className="font-bold text-base">{c.title} — {c.author.name}</h3>
                <div className="prose-arabic text-sm" dangerouslySetInnerHTML={{ __html: c.contentHtml }} />
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (state.kind === 'apologetics-detail') {
    const { entry } = state;
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <article className="card-manuscript p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}>
              {entry.domainAr} • أوفلاين
            </span>
            <a href="/apologetics" className="text-xs font-bold inline-flex items-center gap-1" style={{ color: 'var(--accent-burgundy)' }}>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>كل الشبهات</span>
            </a>
          </div>
          <h1 className="font-scripture text-2xl md:text-3xl font-bold">{entry.question}</h1>
          <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--accent-gold)', backgroundColor: 'var(--bg-parchment)' }}>
            <p className="text-sm leading-7 font-medium">{entry.shortSummary}</p>
          </div>
          <div className="prose-arabic text-base" dangerouslySetInnerHTML={{ __html: entry.answerHtml }} />
        </article>
      </div>
    );
  }

  if (state.kind === 'apologetics-list') {
    const filtered = filterQ.trim()
      ? state.items.filter((i) => i.question.includes(filterQ.trim()) || i.shortSummary.includes(filterQ.trim()))
      : state.items;
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="card-manuscript p-6 space-y-4">
          <h1 className="font-scripture text-2xl font-bold">موسوعة الشبهات ({filtered.length} — وضع أوفلاين)</h1>
          <div className="relative max-w-xl">
            <input
              type="search"
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="ابحث داخل الشبهات المحفوظة..."
              className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm"
              style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
            />
            <Search className="w-4 h-4 absolute right-3 top-3" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.slice(0, 60).map((item) => (
            <a key={item.id} href={`/apologetics/${encodeURIComponent(item.slug)}`} className="card-manuscript p-5 space-y-2 hover:border-[#B68A35]">
              <span className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>{item.domainAr}</span>
              <h2 className="font-bold text-base">{item.question}</h2>
              <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>{item.shortSummary}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === 'explanation-detail') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="card-manuscript p-6 md:p-8 space-y-5">
          <span className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>{state.article.category.name} • أوفلاين</span>
          <h1 className="font-scripture text-2xl md:text-3xl font-bold">{state.article.title}</h1>
          <div className="prose-arabic text-base" dangerouslySetInnerHTML={{ __html: state.article.contentHtml }} />
        </article>
      </div>
    );
  }

  if (state.kind === 'explanations-list') {
    const filtered = filterQ.trim()
      ? state.items.filter((i) => i.title.includes(filterQ.trim()) || i.summary.includes(filterQ.trim()))
      : state.items;
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <div className="card-manuscript p-6 space-y-3">
          <h1 className="font-scripture text-2xl font-bold">الشروحات والمقالات ({filtered.length} — أوفلاين)</h1>
          <input
            type="search"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            placeholder="ابحث في المقالات المحفوظة..."
            className="w-full max-w-xl rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.slice(0, 60).map((a) => (
            <a key={a.id} href={`/explanations/${encodeURIComponent(a.slug)}`} className="card-manuscript p-5 space-y-1.5">
              <span className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>{a.category.name}</span>
              <h2 className="font-bold text-base">{a.title}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.summary}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === 'synaxarium') {
    const filtered = filterQ.trim()
      ? state.entries.filter((s) => s.saintTitle.includes(filterQ.trim()) || s.monthNameAr.includes(filterQ.trim()))
      : state.entries.slice(0, 50);
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="card-manuscript p-6 space-y-3">
          <h1 className="font-scripture text-2xl font-bold">السنكسار القبطي (وضع أوفلاين)</h1>
          <input
            type="search"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            placeholder="ابحث باسم قديس أو شهر قبطي (توت، بابة، كيهك...)..."
            className="w-full max-w-xl rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          />
        </div>
        <div className="space-y-4">
          {filtered.slice(0, 40).map((s) => (
            <article key={s.id} className="card-manuscript p-5 space-y-2">
              <div className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>{s.copticDay} {s.monthNameAr}</div>
              <h2 className="font-bold text-lg">{s.saintTitle}</h2>
              <div className="prose-arabic text-sm" dangerouslySetInnerHTML={{ __html: s.contentHtml }} />
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === 'book-read-pdf') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PdfBookReader slug={state.book.slug} title={state.book.title} authorName={state.book.authorName} />
      </div>
    );
  }

  if (state.kind === 'book-read-html') {
    const chapterMap: Record<number, string> = {};
    for (const ch of state.chapters) chapterMap[ch.chapterNumber] = ch.contentHtml;
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ChapterBookReader
          slug={state.book.slug}
          title={state.book.title}
          authorName={state.book.authorName}
          chapters={state.chapters.map((c) => ({ chapterNumber: c.chapterNumber, title: c.title }))}
          initialChapter={state.chapters[0]?.chapterNumber || 1}
          offlineChapters={chapterMap}
        />
      </div>
    );
  }

  if (state.kind === 'book-not-saved') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="card-manuscript p-6 space-y-3">
          <h1 className="font-scripture text-2xl font-bold">
            {state.catalogBook ? state.catalogBook.title : 'الكتاب غير محفوظ أوفلاين'}
          </h1>
          <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
            ملفات الكتب الكبيرة لا تُحمَّل تلقائياً ضمن باقة الأوفلاين لتوفير المساحة والسرعة؛ يمكنك حفظ أي كتاب تريده للقراءة بدون نت من صفحته عند توفر الاتصال.
          </p>
          {state.savedBooks.length > 0 && (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
              <h2 className="font-bold text-sm">الكتب التي حفظتها أوفلاين ({state.savedBooks.length}):</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {state.savedBooks.map((b) => (
                  <a key={b.slug} href={`/library/${encodeURIComponent(b.slug)}/read`} className="p-3 rounded-lg border text-sm font-semibold hover:underline" style={{ borderColor: 'var(--border-hairline)' }}>
                    <BookOpen className="w-4 h-4 inline ml-1.5" />
                    {b.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="card-manuscript p-6 space-y-3">
        <h1 className="font-scripture text-2xl font-bold">التصفح أوفلاين جاهز</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          الكتاب المقدس ({state.bibleBooks.length} سفراً)، الشبهات ({state.totalApol})، الشروحات ({state.totalExp})، والكتب المحفوظة ({state.savedBooks.length}) متوفرة فوراً.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/apologetics" className="brand-button text-xs">الشبهات ({state.totalApol})</a>
          <a href="/explanations" className="media-action text-xs">الشروحات ({state.totalExp})</a>
          <a href="/synaxarium" className="media-action text-xs">السنكسار</a>
          <Link href="/liturgy" className="media-action text-xs">الأجبية والليتورجيا</Link>
        </div>
      </div>
    </div>
  );
}
