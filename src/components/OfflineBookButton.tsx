'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, Trash2 } from 'lucide-react';
import {
  getSavedBookOffline,
  removeSavedBookOffline,
  saveBookOffline,
} from '@/lib/offline-store';
import { usePwa } from './PwaProvider';

interface Props {
  slug: string;
  title: string;
  authorName: string;
  format: 'PDF' | 'HTML_CHAPTERS' | 'BOTH';
  chapters?: Array<{ chapterNumber: number; title: string }>;
  compact?: boolean;
}

export function OfflineBookButton({ slug, title, authorName, format, chapters, compact = false }: Props) {
  const { refreshOfflineState } = usePwa();
  const [savedBytes, setSavedBytes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSavedBookOffline(slug).then((row) => {
      setSavedBytes(row ? row.bytes : null);
    });
  }, [slug]);

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await saveBookOffline({ slug, title, authorName, format, chapters });
      setSavedBytes(saved.bytes);
      await refreshOfflineState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الكتاب');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeSavedBookOffline(slug);
      setSavedBytes(null);
      await refreshOfflineState();
    } finally {
      setBusy(false);
    }
  };

  const sizeMb = savedBytes ? `${(savedBytes / (1024 * 1024)).toFixed(1)} ميجابايت` : '';

  if (savedBytes !== null) {
    return (
      <div className="inline-flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-3 text-xs sm:text-sm'
          }`}
          style={{
            borderColor: 'var(--accent-gold)',
            backgroundColor: 'var(--bg-parchment)',
            color: 'var(--accent-burgundy)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>محفوظ أوفلاين{!compact && sizeMb ? ` (${sizeMb})` : ''}</span>
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          title="حذف الكتاب من ذاكرة الأوفلاين"
          className={`inline-flex items-center gap-1 rounded-lg border hover:opacity-80 ${
            compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-3 text-xs'
          }`}
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {!compact && <span>إزالة</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className={`media-action ${compact ? '!px-2.5 !py-1.5 !text-xs' : '!px-5 !py-3 !text-sm'}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>{busy ? 'جاري حفظ الكتاب...' : 'حفظ للقراءة أوفلاين'}</span>
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
