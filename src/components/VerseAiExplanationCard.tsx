'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ExternalLink, Loader2, RefreshCw, Send } from 'lucide-react';
import type { OrthodoxAiCitationDto } from '@/lib/api-client';
import { SectionArtwork } from './SectionArtwork';

export interface VerseAiTurn {
  question: string;
  answer: string;
}

export interface VerseAiState {
  loading: boolean;
  verseRef?: string;
  selectedText?: string;
  reply?: string;
  citations?: OrthodoxAiCitationDto[];
  turns: VerseAiTurn[];
  error?: string;
}

interface Props {
  verseNumber: number;
  state: VerseAiState;
  onClose: () => void;
  onRetry: () => void;
  onFollowUp: (question: string) => Promise<void> | void;
}

function renderFormattedLine(line: string, lineIndex: number) {
  const cleaned = line.replace(/^#{1,4}\s*/, '');
  const isHeading = /^#{1,4}\s+/.test(line);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);

  const children = parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} style={{ color: 'var(--heading-ink)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });

  if (isHeading) {
    return (
      <h4
        key={lineIndex}
        className="font-scripture text-base font-bold pt-1.5"
        style={{ color: 'var(--accent-burgundy)' }}
      >
        {children}
      </h4>
    );
  }

  return (
    <p key={lineIndex} className="leading-7">
      {children}
    </p>
  );
}

function FormattedReplyBody({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2 text-sm" style={{ color: 'var(--text-ink)' }}>
      {lines.map((line, idx) => renderFormattedLine(line, idx))}
    </div>
  );
}

export function VerseAiExplanationCard({
  verseNumber,
  state,
  onClose,
  onRetry,
  onFollowUp,
}: Props) {
  const [followUpInput, setFollowUpInput] = useState('');

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = followUpInput.trim();
    if (!clean || state.loading) return;
    setFollowUpInput('');
    await onFollowUp(clean);
  };

  return (
    <div
      data-verse-ai-card
      onClick={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      className="motion-expand-card mt-2 rounded-xl border p-4 space-y-3 shadow-sm"
      style={{
        borderColor: 'var(--accent-gold)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: 'var(--bg-surface-muted)', borderColor: 'var(--accent-gold)' }}
          >
            <SectionArtwork name="ai" className="w-5 h-5" size={48} />
          </span>
          <span className="font-scripture text-sm font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            فهم وشرح الآية ({state.verseRef || `آية ${verseNumber}`})
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border hover:opacity-80"
          style={{
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-muted)',
          }}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>إخفاء الشرح</span>
        </button>
      </div>

      {state.selectedText && (
        <div
          className="text-xs px-2.5 py-1.5 rounded-md border"
          style={{
            borderColor: 'var(--border-hairline)',
            backgroundColor: 'var(--bg-surface-muted)',
            color: 'var(--text-muted)',
          }}
        >
          الجزء المحدد من الآية: «{state.selectedText}»
        </div>
      )}

      {state.loading && !state.reply && (
        <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-burgundy)' }} />
          <span>جاري تحضير الشرح الأرثوذكسي وتفسير الآية...</span>
        </div>
      )}

      {state.error && (
        <div
          className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{
            borderColor: 'var(--accent-burgundy)',
            backgroundColor: 'var(--bg-parchment)',
            color: 'var(--accent-burgundy)',
          }}
        >
          <span>{state.error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-bold underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {state.reply && <FormattedReplyBody text={state.reply} />}

      {state.turns.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
          {state.turns.map((turn, idx) => (
            <div
              key={idx}
              className="rounded-lg p-3 space-y-1.5 text-sm"
              style={{ backgroundColor: 'var(--bg-parchment)' }}
            >
              <div className="text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                سؤالك: {turn.question}
              </div>
              <FormattedReplyBody text={turn.answer} />
            </div>
          ))}
        </div>
      )}

      {state.loading && Boolean(state.reply) && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent-burgundy)' }} />
          <span>جاري الرد على سؤالك حول الآية...</span>
        </div>
      )}

      {state.reply && (
        <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            placeholder="اسأل عن كلمة أو معنى إضافي في هذه الآية..."
            disabled={state.loading}
            className="flex-1 min-w-0 rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
            style={{
              borderColor: 'var(--border-hairline)',
              backgroundColor: 'var(--bg-parchment)',
              color: 'var(--text-ink)',
            }}
          />
          <button
            type="submit"
            disabled={state.loading || !followUpInput.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>اسأل</span>
          </button>
        </form>
      )}

      {state.citations && state.citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
          <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>
            مراجع مرتبطة في المنارة:
          </span>
          {state.citations.map((cite, idx) => (
            <Link
              key={`${cite.url}-${idx}`}
              href={cite.url}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 hover:underline"
              style={{
                borderColor: 'var(--border-hairline)',
                backgroundColor: 'var(--bg-parchment)',
                color: 'var(--heading-ink)',
              }}
            >
              <span className="truncate max-w-[220px]">{cite.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
