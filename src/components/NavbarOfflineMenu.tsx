'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  CheckCircle2,
  Circle,
  CloudDownload,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { OFFLINE_STAGES } from '@/lib/offline-store';
import { usePwa } from './PwaProvider';

function formatBytesMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} م.ب`;
}

export function NavbarOfflineMenu() {
  const pathname = usePathname();
  const {
    isOnline,
    isInstalled,
    offlineBusy,
    offlineProgress,
    offlineLabel,
    syncMeta,
    checkpoint,
    savedBooksCount,
    startOfflineSync,
    clearOfflineData,
    triggerInstall,
  } = usePwa();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const isCompleted = checkpoint?.status === 'completed' || Boolean(syncMeta?.isComplete);
  const isPaused = checkpoint?.status === 'paused' && !offlineBusy;
  const hasAnyOfflineData = Boolean(syncMeta || checkpoint?.completedParts?.length);

  let desktopLabel = 'حفظ أوفلاين';
  let mobileLabel = 'أوفلاين';
  if (offlineBusy) {
    desktopLabel = `تحميل ${offlineProgress}%`;
    mobileLabel = `${offlineProgress}%`;
  } else if (isPaused) {
    desktopLabel = `استئناف ${offlineProgress}%`;
    mobileLabel = `استئناف`;
  } else if (!isOnline) {
    desktopLabel = hasAnyOfflineData ? 'يعمل أوفلاين' : 'غير متصل';
    mobileLabel = 'أوفلاين';
  } else if (isCompleted) {
    desktopLabel = 'متاح أوفلاين';
    mobileLabel = 'جاهز';
  }

  return (
    <div ref={rootRef} className="navbar-offline-wrap">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="حالة العمل أوفلاين وحفظ محتوى الموقع"
        className={`navbar-offline-trigger ${isCompleted ? 'is-synced' : ''} ${isPaused ? 'is-paused' : ''} ${!isOnline ? 'is-offline' : ''}`}
      >
        {offlineBusy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : isPaused ? (
          <PauseCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : !isOnline ? (
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <CloudDownload className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{desktopLabel}</span>
        <span className="sm:hidden navbar-offline-mobile-label">{mobileLabel}</span>
      </button>

      {open && (
        <div
          className="navbar-offline-panel"
          role="dialog"
          aria-label="إعدادات التصفح أوفلاين"
          dir="rtl"
        >
          <div className="navbar-offline-head">
            <div>
              <p className="navbar-offline-title">التصفح بدون إنترنت</p>
              <span className={`navbar-offline-badge ${isOnline ? 'is-online' : 'is-offline'}`}>
                {isOnline ? 'متصل بالإنترنت' : 'أوفلاين الآن'}
              </span>
            </div>
            {(syncMeta?.totalBytes || checkpoint?.totalBytes) ? (
              <span className="navbar-offline-size">
                {formatBytesMb(syncMeta?.totalBytes || checkpoint?.totalBytes || 0)}
              </span>
            ) : null}
          </div>

          <p className="navbar-offline-desc">
            تحميل مرحلي سريع بالترتيب: الشبهات، ثم الكتاب المقدس والعقيدة، ثم الشروحات، ثم السنكسار والليتورجيا (مع استثناء الكتب والتفاسير الضخمة للسرعة، والاستئناف تلقائيًا عند انقطاع النت).
          </p>

          <ul className="navbar-offline-stages" aria-label="مراحل التحميل أوفلاين">
            {OFFLINE_STAGES.map((stage) => {
              const done = Boolean(checkpoint?.completedStages?.includes(stage.id));
              const active = offlineBusy && checkpoint?.currentStage === stage.id;
              const haltedHere = isPaused && checkpoint?.currentStage === stage.id;
              const doneCount = stage.parts.filter((p) => checkpoint?.completedParts?.includes(p)).length;

              return (
                <li
                  key={stage.id}
                  className={`navbar-offline-stage ${done ? 'is-done' : ''} ${active ? 'is-active' : ''} ${haltedHere ? 'is-halted' : ''}`}
                >
                  <span className="navbar-offline-stage-icon">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : active ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : haltedHere ? (
                      <PauseCircle className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Circle className="w-4 h-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="navbar-offline-stage-title">
                    {stage.order}. {stage.title}
                  </span>
                  <span className="navbar-offline-stage-meta">
                    {done ? 'مكتمل' : `${doneCount}/${stage.parts.length}`}
                  </span>
                </li>
              );
            })}
          </ul>

          {(offlineBusy || offlineLabel) && (
            <div className="navbar-offline-progress-box">
              <div className="navbar-offline-progress-meta">
                <span>{offlineLabel || 'جاري التحميل...'}</span>
                <span>{offlineProgress}%</span>
              </div>
              {(offlineBusy || isPaused) && (
                <div className="navbar-offline-progress-track">
                  <div
                    className="navbar-offline-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(4, offlineProgress))}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {syncMeta && (
            <div className="navbar-offline-stats">
              <div>
                <span>الشبهات والردود</span>
                <strong>{syncMeta.counts.apologetics}</strong>
              </div>
              <div>
                <span>الكتاب المقدس</span>
                <strong>{syncMeta.counts.bibleChapters} إصحاح</strong>
              </div>
              <div>
                <span>الشروحات والمقالات</span>
                <strong>{syncMeta.counts.explanations}</strong>
              </div>
              <div>
                <span>السنكسار والكتب المحفوظة</span>
                <strong>
                  {syncMeta.counts.synaxarium} / {savedBooksCount} كتاب
                </strong>
              </div>
            </div>
          )}

          <div className="navbar-offline-actions">
            {isPaused ? (
              <div className="navbar-offline-subactions">
                <button
                  type="button"
                  onClick={() => void startOfflineSync({ reset: false })}
                  disabled={offlineBusy || !isOnline}
                  className="brand-button flex-1 justify-center text-xs py-2.5"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>استئناف من آخر نقطة</span>
                </button>
                <button
                  type="button"
                  onClick={() => void startOfflineSync({ reset: true })}
                  disabled={offlineBusy || !isOnline}
                  aria-label="إعادة التحميل من البداية"
                  title="إعادة التحميل من البداية"
                  className="media-action text-xs px-2.5 py-2.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void startOfflineSync({ reset: isCompleted })}
                disabled={offlineBusy || !isOnline}
                className="brand-button w-full justify-center text-xs py-2.5"
              >
                {offlineBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : isCompleted ? (
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <CloudDownload className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {offlineBusy
                    ? 'جاري التحميل السريع...'
                    : isCompleted
                      ? 'تحديث كل المراحل أوفلاين'
                      : 'بدء التحميل المرحلي السريع'}
                </span>
              </button>
            )}

            <div className="navbar-offline-subactions">
              {(hasAnyOfflineData || savedBooksCount > 0) && (
                <Link
                  href="/offline-reader"
                  onClick={() => setOpen(false)}
                  className="media-action flex-1 justify-center text-xs"
                >
                  <BookMarked className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>قارئ الأوفلاين</span>
                </Link>
              )}

              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void triggerInstall();
                  }}
                  className="media-action flex-1 justify-center text-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>تثبيت التطبيق</span>
                </button>
              )}

              {(hasAnyOfflineData || savedBooksCount > 0) && (
                <button
                  type="button"
                  onClick={() => void clearOfflineData()}
                  disabled={offlineBusy}
                  aria-label="حذف البيانات المحفوظة أوفلاين"
                  className="media-action text-xs px-2.5 text-red-700 dark:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
