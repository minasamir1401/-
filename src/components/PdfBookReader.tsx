'use client';

import { SectionIcon } from '@/components/SectionIcon';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  slug: string;
  title: string;
  authorName: string;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';

export function PdfBookReader({ slug, title, authorName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [theme, setTheme] = useState<ReaderTheme>('sepia');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState('1');

  const streamUrl = `/library/${encodeURIComponent(slug)}/file/stream`;
  const downloadUrl = `/library/${encodeURIComponent(slug)}/file/download`;
  const progressStorageKey = `orthodox-book-page:${slug}`;

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({
          url: streamUrl,
          rangeChunkSize: 65536,
        });

        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);

        const saved = localStorage.getItem(progressStorageKey);
        const initialPage = saved ? Math.min(Math.max(parseInt(saved, 10) || 1, 1), doc.numPages) : 1;
        setPageNum(initialPage);
        setJumpInput(String(initialPage));
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'تعذر تحميل ملف الكتاب');
          setLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      if (pdfDocRef.current) {
        void pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [streamUrl, progressStorageKey]);

  useEffect(() => {
    let active = true;

    async function renderPage() {
      const doc = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || pageNum < 1 || pageNum > doc.numPages) return;

      renderTaskRef.current?.cancel();

      try {
        const page = await doc.getPage(pageNum);
        if (!active) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const task = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = task;
        await task.promise;
        localStorage.setItem(progressStorageKey, String(pageNum));
        setJumpInput(String(pageNum));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.toLowerCase().includes('cancel')) {
          console.warn('PDF render warning:', msg);
        }
      }
    }

    void renderPage();
    return () => {
      active = false;
    };
  }, [pageNum, scale, totalPages, progressStorageKey]);

  const goToPage = (next: number) => {
    if (!totalPages) return;
    const bounded = Math.min(Math.max(next, 1), totalPages);
    setPageNum(bounded);
  };

  const containerThemeClass =
    theme === 'dark'
      ? 'bg-[#120F0E] text-[#EFE8DC]'
      : theme === 'sepia'
        ? 'bg-[#EFE6D5] text-[#2B2118]'
        : 'bg-[#F5F5F4] text-[#1C1917]';

  return (
    <div className={`min-h-[85vh] rounded-xl border overflow-hidden flex flex-col ${containerThemeClass}`} style={{ borderColor: 'var(--border-hairline)' }}>
      {/* Reader Top Bar */}
      <div
        className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)', color: 'var(--text-ink)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/library/${encodeURIComponent(slug)}`}
            className="p-1.5 rounded-lg border hover:opacity-80"
            style={{ borderColor: 'var(--border-hairline)' }}
            title="العودة لصفحة الكتاب"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="section-page-title font-bold text-sm truncate"><SectionIcon name="book" />{title}</h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{authorName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Page Controls */}
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
            <button
              onClick={() => goToPage(pageNum - 1)}
              disabled={pageNum <= 1}
              className="p-1 disabled:opacity-40"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                goToPage(parseInt(jumpInput, 10) || pageNum);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                min={1}
                max={totalPages || 1}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="w-12 text-center border rounded px-1 py-0.5 text-xs"
                style={{ borderColor: 'var(--border-hairline)' }}
              />
              <span>/ {totalPages || '-'}</span>
            </form>
            <button
              onClick={() => goToPage(pageNum + 1)}
              disabled={totalPages > 0 && pageNum >= totalPages}
              className="p-1 disabled:opacity-40"
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
            <button onClick={() => setScale((s) => Math.max(0.7, +(s - 0.15).toFixed(2)))} aria-label="تصغير">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-1">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2.4, +(s + 0.15).toFixed(2)))} aria-label="تكبير">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Theme */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ReaderTheme)}
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            <option value="sepia">ورق عتيق</option>
            <option value="light">نهاري</option>
            <option value="dark">ليلي</option>
          </select>

          <a
            href={downloadUrl}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل PDF</span>
          </a>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
        {loading && (
          <div className="py-20 text-center space-y-2">
            <p className="font-bold text-base">جاري تجهيز صفحات الكتاب...</p>
            <p className="text-xs opacity-75">يتم البث مباشرة عبر الخادم لتسريع القراءة داخل الموقع</p>
          </div>
        )}

        {error && (
          <div className="max-w-md card-manuscript p-6 text-center space-y-3 my-12" style={{ color: 'var(--text-ink)' }}>
            <p className="font-bold text-red-700">تعذر عرض ملف الـ PDF داخل القارئ</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: 'var(--accent-burgundy)' }}
            >
              <Download className="w-4 h-4" />
              <span>محاولة التحميل المباشر</span>
            </a>
          </div>
        )}

        {!loading && !error && (
          <div className="shadow-2xl rounded overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className={theme === 'dark' ? 'invert hue-rotate-180 contrast-95' : ''}
            />
          </div>
        )}
      </div>
    </div>
  );
}
