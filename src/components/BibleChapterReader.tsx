'use client';

import { SectionIcon } from '@/components/SectionIcon';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Minus,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  postClientApi,
  type ApologeticsSummaryDto,
  type BibleVerseAiResponseDto,
} from '@/lib/api-client';
import { VerseAiExplanationCard, type VerseAiState } from './VerseAiExplanationCard';

interface VerseItem {
  id: number;
  verseNumber: number;
  textTashkeel: string;
}

interface MarkedVerseState {
  id: number;
  verseNumber: number;
  selectedText?: string;
}

interface CommentaryItem {
  id: number;
  title: string;
  contentHtml: string;
  sourceName: string;
  sourceUrl: string;
  author: { name: string };
}

interface Props {
  book: {
    slug: string;
    nameAr: string;
    chaptersCount: number;
  };
  chapter: number;
  verses: VerseItem[];
  commentaries: CommentaryItem[];
  apologetics?: ApologeticsSummaryDto[];
}

function stripDiacritics(input: string): string {
  return input.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

function findAncestorWithAttr(node: Node | null, attr: string): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.hasAttribute(attr)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

export function BibleChapterReader({ book, chapter, verses, commentaries, apologetics = [] }: Props) {
  const [showTashkeel, setShowTashkeel] = useState(true);
  const [fontSize, setFontSize] = useState(22);
  const [showCommentary, setShowCommentary] = useState(commentaries.length > 0 || apologetics.length > 0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [markedVerse, setMarkedVerse] = useState<MarkedVerseState | null>(null);
  const [aiStates, setAiStates] = useState<Record<number, VerseAiState>>({});
  const [openAiIds, setOpenAiIds] = useState<Record<number, boolean>>({});
  const commentaryButton = useRef<HTMLButtonElement>(null);
  const commentaryHeading = useRef<HTMLHeadingElement>(null);
  const isDeuteronomyOpening = book.slug === 'deuteronomy' && chapter === 1;

  const openCommentary = () => {
    setShowCommentary(true);
    requestAnimationFrame(() => {
      commentaryHeading.current?.focus({ preventScroll: true });
      document.getElementById('commentary')?.scrollIntoView({ block: 'start' });
    });
  };

  const copyVerse = async (v: VerseItem) => {
    const text = showTashkeel ? v.textTashkeel : stripDiacritics(v.textTashkeel);
    const formatted = `"${text}" (${book.nameAr} ${chapter}: ${v.verseNumber})`;
    try { await navigator.clipboard.writeText(formatted); } catch { return; }
    setCopiedId(v.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSelectionHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const rawSelected = selection.toString().replace(/\s+/g, ' ').trim();
    if (rawSelected.length < 2) return;

    const anchorVerseEl = findAncestorWithAttr(selection.anchorNode, 'data-verse-id');
    const focusVerseEl = findAncestorWithAttr(selection.focusNode, 'data-verse-id');
    const verseEl = anchorVerseEl || focusVerseEl;
    if (!verseEl) return;

    // Ignore text selections originating inside an open AI explanation card.
    if (findAncestorWithAttr(selection.anchorNode, 'data-verse-ai-card')) {
      return;
    }

    const verseId = Number(verseEl.getAttribute('data-verse-id'));
    const verseObj = verses.find((item) => item.id === verseId);
    if (!verseObj) return;

    const displayedVerseText = (showTashkeel ? verseObj.textTashkeel : stripDiacritics(verseObj.textTashkeel)).trim();
    const cleanedSnippet =
      rawSelected === String(verseObj.verseNumber) || rawSelected === displayedVerseText
        ? undefined
        : rawSelected.slice(0, 320);

    setMarkedVerse({
      id: verseObj.id,
      verseNumber: verseObj.verseNumber,
      selectedText: cleanedSnippet,
    });
  };

  const handleVerseClick = (e: React.MouseEvent<HTMLDivElement>, v: VerseItem) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, form, [data-verse-ai-card]')) {
      return;
    }

    const activeSelection = window.getSelection()?.toString().trim() ?? '';
    if (activeSelection.length >= 2) {
      return;
    }

    setMarkedVerse((prev) =>
      prev?.id === v.id && !prev.selectedText
        ? null
        : { id: v.id, verseNumber: v.verseNumber },
    );
  };

  const requestVerseExplanation = async (
    v: VerseItem,
    selectedText?: string,
    forceRefresh = false,
  ) => {
    const normalizedSnippet = selectedText?.trim() || undefined;
    setMarkedVerse({
      id: v.id,
      verseNumber: v.verseNumber,
      selectedText: normalizedSnippet,
    });
    setOpenAiIds((prev) => ({ ...prev, [v.id]: true }));

    const existing = aiStates[v.id];
    if (existing?.loading) return;
    if (
      !forceRefresh &&
      existing?.reply &&
      !existing.error &&
      existing.selectedText === normalizedSnippet
    ) {
      return;
    }

    setAiStates((prev) => ({
      ...prev,
      [v.id]: {
        loading: true,
        selectedText: normalizedSnippet,
        reply: forceRefresh ? undefined : existing?.reply,
        verseRef: existing?.verseRef || `${book.nameAr} ${chapter}: ${v.verseNumber}`,
        citations: existing?.citations,
        turns: forceRefresh ? [] : (existing?.turns ?? []),
        error: undefined,
      },
    }));

    try {
      const res = await postClientApi<BibleVerseAiResponseDto>('/api/ai/explain-verse', {
        bookSlug: book.slug,
        chapter,
        verseNumber: v.verseNumber,
        selectedText: normalizedSnippet,
      });

      setAiStates((prev) => ({
        ...prev,
        [v.id]: {
          loading: false,
          verseRef: res.verseRef,
          selectedText: normalizedSnippet,
          reply: res.reply,
          citations: res.citations,
          turns: [],
          error: undefined,
        },
      }));
    } catch (err) {
      setAiStates((prev) => ({
        ...prev,
        [v.id]: {
          loading: false,
          verseRef: `${book.nameAr} ${chapter}: ${v.verseNumber}`,
          selectedText: normalizedSnippet,
          turns: existing?.turns ?? [],
          error: err instanceof Error ? err.message : 'تعذر تحميل شرح الآية حالياً.',
        },
      }));
    }
  };

  const askVerseFollowUp = async (v: VerseItem, question: string) => {
    const existing = aiStates[v.id];
    if (!existing?.reply || existing.loading) return;

    const history = [
      { role: 'model' as const, text: existing.reply },
      ...existing.turns.flatMap((turn) => [
        { role: 'user' as const, text: turn.question },
        { role: 'model' as const, text: turn.answer },
      ]),
    ];

    setAiStates((prev) => ({
      ...prev,
      [v.id]: {
        ...prev[v.id],
        loading: true,
        error: undefined,
      },
    }));

    try {
      const res = await postClientApi<BibleVerseAiResponseDto>('/api/ai/explain-verse', {
        bookSlug: book.slug,
        chapter,
        verseNumber: v.verseNumber,
        selectedText: existing.selectedText,
        followUp: question,
        history,
      });

      setAiStates((prev) => {
        const current = prev[v.id];
        return {
          ...prev,
          [v.id]: {
            ...current,
            loading: false,
            turns: [...(current?.turns ?? []), { question, answer: res.reply }],
            citations: res.citations?.length ? res.citations : current?.citations,
            error: undefined,
          },
        };
      });
    } catch (err) {
      setAiStates((prev) => ({
        ...prev,
        [v.id]: {
          ...prev[v.id],
          loading: false,
          error: err instanceof Error ? err.message : 'تعذر إرسال سؤالك حول الآية.',
        },
      }));
    }
  };

  const chapterNumbers = Array.from({ length: Math.max(book.chaptersCount, chapter) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Sticky Chapter Toolbar */}
      <div
        className="card-manuscript p-4 flex flex-wrap items-center justify-between gap-3 sm:sticky sm:top-18 lg:top-34 z-30"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/bible" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
            كل الأسفار
          </Link>
          <h1 className="section-page-title font-scripture text-xl md:text-2xl font-bold"><SectionIcon name="bible" />
            {book.nameAr} — الأصحاح {chapter}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1" style={{ borderColor: 'var(--border-hairline)' }}>
            <button
              onClick={() => setFontSize((s) => Math.max(16, s - 2))}
              aria-label="تصغير الخط"
              className="p-1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(34, s + 2))}
              aria-label="تكبير الخط"
              className="p-1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowTashkeel(!showTashkeel)}
            aria-pressed={showTashkeel}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium"
            style={{
              borderColor: 'var(--border-hairline)',
              backgroundColor: showTashkeel ? 'var(--bg-surface-muted)' : 'transparent',
            }}
          >
            {showTashkeel ? 'إخفاء التشكيل' : 'إظهار التشكيل'}
          </button>

          <button
            ref={commentaryButton}
            onClick={openCommentary}
            aria-expanded={showCommentary}
            aria-controls="commentary"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>اقرأ التفسير</span>
          </button>
        </div>
      </div>

      {/* Chapter Selector Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {chapterNumbers.map((num) => (
          <Link
            key={num}
            href={`/bible/${book.slug}/${num}`}
            aria-current={num === chapter ? 'page' : undefined}
            className="w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-semibold shrink-0 transition"
            style={{
              backgroundColor: num === chapter ? 'var(--accent-burgundy)' : 'var(--bg-surface)',
              color: num === chapter ? '#FFFFFF' : 'var(--text-ink)',
              borderColor: num === chapter ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
            }}
          >
            {num}
          </Link>
        ))}
      </div>

      {/* Dual Pane: Scripture + Commentary */}
      <div className={`grid gap-6 ${showCommentary ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        <article aria-label="نص الأصحاح" className={`${showCommentary ? 'lg:col-span-7' : ''} min-w-0 card-manuscript p-6 md:p-8 space-y-4`}>
          {verses.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              آيات هذا الأصحاح غير متاحة حاليًا.
            </p>
          ) : (
            <>
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{
                  borderColor: 'var(--border-hairline)',
                  backgroundColor: 'var(--bg-parchment)',
                  color: 'var(--text-muted)',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-burgundy)' }} />
                  <span>اضغط على أي آية أو علّم جزءاً منها ليظهر زر «شرح بالـ AI — فهم الآية» ويكون الشرح تحتها مباشرة.</span>
                </span>
              </div>

              <div
                className="space-y-3"
                onMouseUp={handleSelectionHighlight}
                onTouchEnd={handleSelectionHighlight}
              >
                {verses.map((v) => {
                  const display = showTashkeel ? v.textTashkeel : stripDiacritics(v.textTashkeel);
                  const isMarked = markedVerse?.id === v.id;
                  const activeSnippet = isMarked ? markedVerse?.selectedText : undefined;
                  const aiState = aiStates[v.id];
                  const isExplanationOpen = Boolean(openAiIds[v.id] && aiState);
                  const hasExistingReply = Boolean(aiState?.reply);
                  const snippetChanged =
                    hasExistingReply && (activeSnippet || undefined) !== aiState?.selectedText;

                  const explainButtonLabel = snippetChanged
                    ? 'شرح الجزء المحدد بالـ AI'
                    : isExplanationOpen && hasExistingReply
                      ? 'تحديث الشرح بالـ AI'
                      : hasExistingReply
                        ? 'عرض شرح الـ AI'
                        : 'شرح بالـ AI — فهم الآية';

                  return (
                    <div
                      key={v.id}
                      id={`verse-${v.verseNumber}`}
                      data-verse-id={v.id}
                      data-verse-number={v.verseNumber}
                      onClick={(e) => handleVerseClick(e, v)}
                      className="group scroll-mt-52 target:bg-[var(--bg-surface-muted)] flex flex-col gap-2 py-2 px-2.5 rounded-lg border transition cursor-pointer"
                      style={{
                        borderColor: isMarked ? 'var(--accent-gold)' : 'transparent',
                        backgroundColor: isMarked ? 'var(--bg-surface-muted)' : undefined,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full mt-1.5 shrink-0 transition"
                          style={{
                            backgroundColor: isMarked ? 'var(--accent-burgundy)' : 'var(--bg-surface-muted)',
                            color: isMarked ? '#FFFFFF' : 'var(--accent-burgundy)',
                          }}
                        >
                          {v.verseNumber}
                        </span>

                        <p
                          className="font-scripture min-w-0 flex-1 leading-[2] selection:bg-[var(--accent-gold)]/30"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {display}
                        </p>

                        <div className="flex items-center gap-0.5 shrink-0 mt-1">
                          <button
                            type="button"
                            onClick={() => void requestVerseExplanation(v, activeSnippet)}
                            title="شرح وفهم الآية بالـ AI"
                            aria-label="شرح وفهم الآية بالـ AI"
                            className={`${isMarked ? 'opacity-100' : 'sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100'} p-1.5 rounded transition`}
                            style={{ color: 'var(--accent-burgundy)' }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyVerse(v)}
                            title="نسخ الآية"
                            aria-label={copiedId === v.id ? 'تم نسخ الآية' : 'نسخ الآية'}
                            className={`${isMarked ? 'opacity-100' : 'sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100'} p-1.5 rounded transition`}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {copiedId === v.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isMarked && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 pr-7 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void requestVerseExplanation(
                                  v,
                                  activeSnippet,
                                  Boolean(isExplanationOpen && hasExistingReply && !snippetChanged),
                                )
                              }
                              disabled={Boolean(aiState?.loading)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-60"
                              style={{ backgroundColor: 'var(--accent-burgundy)' }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{aiState?.loading ? 'جاري الشرح...' : explainButtonLabel}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => copyVerse(v)}
                              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                              style={{
                                borderColor: 'var(--border-hairline)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-ink)',
                              }}
                            >
                              {copiedId === v.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>

                            {activeSnippet && (
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full border max-w-xs truncate"
                                style={{
                                  borderColor: 'var(--accent-gold)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                }}
                                title={activeSnippet}
                              >
                                المحدد: «{activeSnippet}»
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setMarkedVerse(null)}
                            aria-label="إلغاء تحديد الآية"
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:underline"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>إلغاء التحديد</span>
                          </button>
                        </div>
                      )}

                      {isExplanationOpen && aiState && (
                        <VerseAiExplanationCard
                          verseNumber={v.verseNumber}
                          state={aiState}
                          onClose={() =>
                            setOpenAiIds((prev) => ({
                              ...prev,
                              [v.id]: false,
                            }))
                          }
                          onRetry={() => void requestVerseExplanation(v, activeSnippet, true)}
                          onFollowUp={(question) => askVerseFollowUp(v, question)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom Chapter Prev/Next */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-6 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
            {chapter > 1 ? (
              <Link
                href={`/bible/${book.slug}/${chapter - 1}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <ChevronRight className="w-4 h-4" />
                <span>الأصحاح السابق</span>
              </Link>
            ) : <span />}

            {chapter < book.chaptersCount && (
              <Link
                href={`/bible/${book.slug}/${chapter + 1}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--accent-burgundy)' }}
              >
                <span>الأصحاح التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
          </div>
        </article>

        {showCommentary && (
          <aside id="commentary" aria-labelledby="commentary-heading" className="scroll-mt-48 min-w-0 lg:col-span-5 card-manuscript p-5 md:p-6 space-y-5 h-fit">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="commentary-heading" ref={commentaryHeading} tabIndex={-1} className="section-page-title font-scripture text-2xl font-bold">
                <SectionIcon name="explanations" />تفسير الأصحاح
              </h2>
              <button type="button" className="media-action text-xs" onClick={() => {
                setShowCommentary(false);
                commentaryButton.current?.focus();
                commentaryButton.current?.scrollIntoView({ block: 'center' });
              }}>إخفاء التفسير</button>
            </div>
            {apologetics.length > 0 && (
              <section className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--accent-gold)', backgroundColor: 'var(--bg-parchment)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--accent-burgundy)' }}>
                    <SectionIcon name="shield" />
                    <span>شبهات وردود مرتبطة بهذا الأصحاح ({apologetics.length})</span>
                  </h3>
                  <Link href="/apologetics" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
                    الموسوعة
                  </Link>
                </div>
                <ul className="space-y-2.5">
                  {apologetics.map((ap) => (
                    <li key={ap.slug} className="pb-2 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--border-hairline)' }}>
                      <Link
                        href={`/apologetics/${encodeURIComponent(ap.slug)}`}
                        className="font-bold text-xs leading-6 hover:underline block"
                        style={{ color: 'var(--heading-ink)' }}
                      >
                        {ap.question}
                      </Link>
                      {ap.verseLabel && (
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-gold)' }}>
                          {ap.verseLabel}
                        </span>
                      )}
                      <p className="text-xs leading-6 mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {ap.shortSummary}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {isDeuteronomyOpening && (
              <section className="rounded-lg bg-[var(--bg-surface-muted)] p-4 space-y-2">
                <h3 className="font-bold">الأصحاح ببساطة</h3>
                <p className="text-sm leading-7">
                  موسى بيفكّر الشعب برحلتهم من حوريب. اختار قضاة يساعدوه في رعاية الشعب، ولما الجواسيس رجعوا من أرض الموعد خاف الناس ورفضوا يدخلوا. بعد كده حاولوا يحاربوا رغم تحذير موسى، فانهزموا.
                </p>
              </section>
            )}
            {commentaries.length === 0 ? (
              <div className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
                <p>تفسير هذا الأصحاح غير متاح حاليًا.</p>
                <p className="text-xs">
                  تصفّح <Link href="/explanations" className="underline">الشروحات والتفاسير</Link> أو <Link href="/videos?category=bible#watch" className="underline">التفاسير المصوّرة</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {commentaries.map((c) => (
                  <div key={c.id} className="space-y-2 pb-4 border-b last:border-b-0" style={{ borderColor: 'var(--border-hairline)' }}>
                    <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
                      {c.author.name}
                    </div>
                    <h3 className="font-bold text-base">{c.title}</h3>
                    <div
                      className="prose-arabic bible-commentary"
                      dangerouslySetInnerHTML={{ __html: c.contentHtml }}
                    />
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs underline"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      المصدر: {c.sourceName}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
