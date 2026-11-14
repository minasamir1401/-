'use client';

import { SectionIcon } from '@/components/SectionIcon';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Download, Minus, Plus } from 'lucide-react';

interface ChapterSummary {
  chapterNumber: number;
  title: string;
}

interface Props {
  slug: string;
  title: string;
  authorName: string;
  chapters: ChapterSummary[];
  initialChapter: number;
}

export function ChapterBookReader({ slug, title, authorName, chapters, initialChapter }: Props) {
  const [activeNum, setActiveNum] = useState(initialChapter);
  const [contentHtml, setContentHtml] = useState('');
  const [fontSize, setFontSize] = useState(19);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const activeIndex = chapters.findIndex((chapter) => chapter.chapterNumber === activeNum);
  const chapterTitle = chapters[activeIndex]?.title;

  useEffect(() => {
    const request = new AbortController();
    setLoading(true);
    setFailed(false);
    fetch(`/library/${encodeURIComponent(slug)}/file/${activeNum}`, { signal: request.signal })
      .then((r) => { if (!r.ok) throw new Error('Chapter unavailable'); return r.json(); })
      .then((data) => {
        if (request.signal.aborted) return;
        setContentHtml(data.chapter?.contentHtml || '');
        setLoading(false);
      })
      .catch(() => {
        if (!request.signal.aborted) { setFailed(true); setLoading(false); }
      });
    return () => {
      request.abort();
    };
  }, [slug, activeNum]);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <aside className="lg:col-span-4 card-manuscript p-5 space-y-4 h-fit lg:sticky lg:top-34">
        <div className="flex items-center gap-2">
          <Link
            href={`/library/${encodeURIComponent(slug)}`}
            aria-label="العودة إلى تفاصيل الكتاب"
            className="p-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="section-page-title font-bold text-sm truncate"><SectionIcon name="book" />{title}</h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{authorName}</p>
          </div>
        </div>

        <a className="media-action" href={`/library/${encodeURIComponent(slug)}/file/download`}>
          <Download className="w-4 h-4" aria-hidden /> تحميل نسخة للقراءة
        </a>
        <div className="space-y-1.5 max-h-56 lg:max-h-[55vh] overflow-y-auto">
          {chapters.map((ch) => (
            <button
              key={ch.chapterNumber}
              aria-pressed={ch.chapterNumber === activeNum}
              onClick={() => setActiveNum(ch.chapterNumber)}
              className="w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition border"
              style={{
                backgroundColor: ch.chapterNumber === activeNum ? 'var(--accent-burgundy)' : 'transparent',
                color: ch.chapterNumber === activeNum ? '#FFFFFF' : 'var(--text-ink)',
                borderColor: ch.chapterNumber === activeNum ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
              }}
            >
              {ch.chapterNumber}. {ch.title}
            </button>
          ))}
        </div>
      </aside>

      <article className="min-w-0 lg:col-span-8 card-manuscript p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <h2 className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            {chapterTitle}
          </h2>
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1" style={{ borderColor: 'var(--border-hairline)' }}>
            <button onClick={() => setFontSize((s) => Math.max(15, s - 1))} aria-label="تصغير">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs px-1">{fontSize}px</span>
            <button onClick={() => setFontSize((s) => Math.min(28, s + 1))} aria-label="تكبير">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            جاري تحميل الفصل...
          </p>
        ) : failed || !contentHtml ? (
          <p role="status" className="media-muted py-8">تعذّر عرض هذا الفصل. اختر فصلًا آخر أو ارجع إلى صفحة الكتاب.</p>
        ) : (
          <div
            className="prose-arabic font-scripture break-words"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        <div className="flex flex-wrap gap-2 items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
          <button
            onClick={() => chapters[activeIndex - 1] && setActiveNum(chapters[activeIndex - 1].chapterNumber)}
            disabled={activeIndex < 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <ChevronRight className="w-4 h-4" />
            <span>الفصل السابق</span>
          </button>
          <button
            onClick={() => chapters[activeIndex + 1] && setActiveNum(chapters[activeIndex + 1].chapterNumber)}
            disabled={activeIndex >= chapters.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            <span>الفصل التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
