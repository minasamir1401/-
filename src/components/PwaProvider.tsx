'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import {
  clearAllSiteOffline,
  getOfflineCheckpoint,
  getOfflineSyncMeta,
  listSavedBooksOffline,
  OFFLINE_STAGES,
  syncFullSiteOffline,
  type OfflineSyncCheckpoint,
  type OfflineSyncMeta,
} from '@/lib/offline-store';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextValue {
  isOnline: boolean;
  isInstalled: boolean;
  canDirectInstall: boolean;
  isIosSafari: boolean;
  offlineBusy: boolean;
  offlineProgress: number;
  offlineLabel: string;
  syncMeta: OfflineSyncMeta | null;
  checkpoint: OfflineSyncCheckpoint | null;
  savedBooksCount: number;
  startOfflineSync: (options?: { reset?: boolean }) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  refreshOfflineState: () => Promise<void>;
  openInstallPrompt: () => void;
  triggerInstall: () => Promise<void>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

const DISMISS_KEY = 'orthodox-pwa-install-dismissed';
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error('usePwa must be used inside PwaProvider');
  return ctx;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);

  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const [offlineLabel, setOfflineLabel] = useState('');
  const [syncMeta, setSyncMeta] = useState<OfflineSyncMeta | null>(null);
  const [checkpoint, setCheckpoint] = useState<OfflineSyncCheckpoint | null>(null);
  const [savedBooksCount, setSavedBooksCount] = useState(0);

  const offlineBusyRef = useRef(false);
  const autoResumeRef = useRef(false);

  const refreshOfflineState = useCallback(async () => {
    try {
      const [meta, cp, books] = await Promise.all([
        getOfflineSyncMeta(),
        getOfflineCheckpoint(),
        listSavedBooksOffline(),
      ]);
      setSyncMeta(meta);
      setCheckpoint(cp);
      setSavedBooksCount(books.length);

      if (cp && !offlineBusyRef.current) {
        const totalParts = OFFLINE_STAGES.reduce((acc, s) => acc + s.parts.length, 0);
        const pct =
          cp.status === 'completed'
            ? 100
            : Math.round((cp.completedParts.length / totalParts) * 95);
        setOfflineProgress(pct);
        if (cp.status === 'paused' && cp.failedReason) {
          setOfflineLabel(cp.failedReason);
        }
      }
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  const startOfflineSync = useCallback(
    async (options?: { reset?: boolean }) => {
      if (offlineBusyRef.current) return;
      offlineBusyRef.current = true;
      autoResumeRef.current = false;
      setOfflineBusy(true);
      if (options?.reset) {
        setOfflineProgress(2);
      }
      setOfflineLabel('المرحلة 1: جاري بدء تحميل الشبهات...');
      try {
        const meta = await syncFullSiteOffline((pct, label, cp) => {
          setOfflineProgress(pct);
          setOfflineLabel(label);
          setCheckpoint(cp);
        }, options);
        setSyncMeta(meta);
        autoResumeRef.current = false;
      } catch (err) {
        autoResumeRef.current = true;
        setOfflineLabel(
          err instanceof Error ? err.message : 'انقطع الاتصال — سيتم الاستئناف من آخر نقطة',
        );
      } finally {
        offlineBusyRef.current = false;
        setOfflineBusy(false);
        await refreshOfflineState();
      }
    },
    [refreshOfflineState],
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    setIsIosSafari(ios);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    void refreshOfflineState();

    const earlyPrompt = window.__deferredPwaPrompt;
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
    }

    const onOnline = () => {
      setIsOnline(true);
      if (autoResumeRef.current && !offlineBusyRef.current) {
        void startOfflineSync({ reset: false });
      }
    };
    const onOffline = () => setIsOnline(false);
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setShowManualHint(false);
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (!standalone && Date.now() - dismissedAt > DISMISS_TTL_MS) {
        setShowBanner(true);
      }
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowManualHint(false);
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    if (!standalone) {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissedAt > DISMISS_TTL_MS) {
        showTimer = setTimeout(() => {
          setShowBanner(true);
        }, 1200);
      }
    }

    return () => {
      if (showTimer) clearTimeout(showTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [refreshOfflineState, startOfflineSync]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setShowManualHint(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const triggerInstall = useCallback(async () => {
    const promptEvent = deferredPrompt ?? window.__deferredPwaPrompt ?? null;
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
        setShowManualHint(false);
        window.__deferredPwaPrompt = null;
        setDeferredPrompt(null);
      }
      return;
    }
    setShowBanner(true);
    setShowManualHint(true);
  }, [deferredPrompt]);

  const openInstallPrompt = useCallback(() => {
    setShowManualHint(!deferredPrompt);
    setShowBanner(true);
  }, [deferredPrompt]);

  const clearOfflineData = useCallback(async () => {
    if (offlineBusyRef.current) return;
    autoResumeRef.current = false;
    await clearAllSiteOffline();
    setSyncMeta(null);
    setCheckpoint(null);
    setOfflineProgress(0);
    setOfflineLabel('');
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isOnline,
        isInstalled,
        canDirectInstall: Boolean(deferredPrompt),
        isIosSafari,
        offlineBusy,
        offlineProgress,
        offlineLabel,
        syncMeta,
        checkpoint,
        savedBooksCount,
        startOfflineSync,
        clearOfflineData,
        refreshOfflineState,
        openInstallPrompt,
        triggerInstall,
      }}
    >
      {children}

      {showBanner && !isInstalled && (
        <aside
          className="pwa-install-banner card-manuscript"
          aria-label="تثبيت تطبيق المنارة الأرثوذكسية"
          dir="rtl"
        >
          <div className="pwa-install-top">
            <span className="pwa-install-icon">
              <Smartphone className="w-6 h-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2>منصتك أقرب… حمّل التطبيق</h2>
              <p>ثبّت المنارة الأرثوذكسية على الموبايل أو الكمبيوتر وتصفح الكتاب المقدس والشبهات سريعاً حتى أوفلاين.</p>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="pwa-install-close"
              aria-label="إخفاء دعوة التثبيت"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {showManualHint && (
            <p className="pwa-install-hint">
              {isIosSafari
                ? 'على آيفون أو آيباد: اضغط زر المشاركة في أسفل Safari ثم اختر «إضافة إلى الشاشة الرئيسية».'
                : 'لتثبيت التطبيق: اضغط أيقونة التثبيت في شريط العنوان بالأعلى، أو افتح قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'}
            </p>
          )}

          <div className="pwa-install-actions">
            <button type="button" onClick={triggerInstall} className="pwa-install-primary brand-button">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>حمّل التطبيق</span>
            </button>
            <button type="button" onClick={dismissBanner} className="pwa-install-secondary media-action">
              لاحقًا
            </button>
          </div>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
