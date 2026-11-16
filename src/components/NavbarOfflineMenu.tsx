'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  CheckCircle2,
  CloudDownload,
  Loader2,
  RefreshCw,
  Smartphone,
  Trash2,
  WifiOff,
} from 'lucide-react';
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

  const isReady = Boolean(syncMeta);

  let desktopLabel = 'حفظ أوفلاين';
  let mobileLabel = 'أوفلاين';
  if (offlineBusy) {
    desktopLabel = `جاري الحفظ ${offlineProgress}%`;
    mobileLabel = `${offlineProgress}%`;
  } else if (!isOnline) {
    desktopLabel = isReady ? 'يعمل أوفلاين' : 'غير متصل';
    mobileLabel = 'أوفلاين';
  } else if (isReady) {
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
        className={`navbar-offline-trigger ${isReady ? 'is-synced' : ''} ${!isOnline ? 'is-offline' : ''}`}
      >
        {offlineBusy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : !isOnline ? (
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : isReady ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <CloudDownload className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{desktopLabel}</span>
        <span className="sm:hidden text-[0.72rem]">{mobileLabel}</span>
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
            {syncMeta && (
              <span className="navbar-offline-size">{formatBytesMb(syncMeta.totalBytes)}</span>
            )}
          </div>

          <p className="navbar-offline-desc">
            يحفظ سريعًا الكتاب المقدس والتفاسير والشبهات والسنكسار والليتورجيا وكل صفحات الموقع للعمل أوفلاين، باستثناء ملفات الكتب التي تحمّلها اختياريًا من صفحة كل كتاب.
          </p>

          {(offlineBusy || offlineLabel) && (
            <div className="navbar-offline-progress-box">
              <div className="navbar-offline-progress-meta">
                <span>{offlineLabel || 'جاري التحميل...'}</span>
                {offlineBusy && <span>{offlineProgress}%</span>}
              </div>
              {offlineBusy && (
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
                <span>الكتاب المقدس</span>
                <strong>{syncMeta.counts.bibleChapters} إصحاح</strong>
              </div>
              <div>
                <span>الشبهات والردود</span>
                <strong>{syncMeta.counts.apologetics}</strong>
              </div>
              <div>
                <span>الشروحات والتفاسير</span>
                <strong>{syncMeta.counts.explanations + syncMeta.counts.commentaries}</strong>
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
            <button
              type="button"
              onClick={() => void startOfflineSync()}
              disabled={offlineBusy || !isOnline}
              className="brand-button w-full justify-center text-xs py-2.5"
            >
              {offlineBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : isReady ? (
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              ) : (
                <CloudDownload className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {offlineBusy
                  ? 'جاري التحميل السريع...'
                  : isReady
                    ? 'تحديث المحتوى أوفلاين'
                    : 'تحميل كل الموقع أوفلاين'}
              </span>
            </button>

            <div className="navbar-offline-subactions">
              {(isReady || savedBooksCount > 0) && (
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

              {(isReady || savedBooksCount > 0) && (
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
