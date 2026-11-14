'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL_SELECTOR = [
  '.home-shortcut',
  '.home-book',
  '.home-article',
  '.home-reading',
  '.home-section-heading',
  '.card-manuscript',
].join(', ');

/**
 * Coordinates site-wide scroll progress, route transitions, and graceful scroll-reveal animations.
 */
export function SiteMotionCoordinator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      const bar = progressRef.current;
      if (!bar) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observed = new WeakSet<Element>();
    let fallbackTimers: number[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        let visibleBatchIndex = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delayMs = Math.min(visibleBatchIndex * 38, 220);
          el.style.setProperty('--reveal-delay', `${delayMs}ms`);
          el.classList.add('motion-revealed');
          el.classList.remove('motion-pending');
          observer.unobserve(el);
          visibleBatchIndex += 1;
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -24px 0px' },
    );

    const scanTargets = () => {
      const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      const viewportHeight = window.innerHeight || 900;

      for (const el of elements) {
        if (observed.has(el)) continue;
        observed.add(el);

        // Keep sticky headers/toolbars permanently visible without vertical transform offset.
        if (el.classList.contains('sticky')) {
          el.classList.add('motion-revealed');
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight * 0.96) {
          el.classList.add('motion-revealed');
        } else {
          el.classList.add('motion-pending');
          observer.observe(el);
        }
      }
    };

    const rafScan = window.requestAnimationFrame(scanTargets);
    const mutationObserver = new MutationObserver(() => {
      window.requestAnimationFrame(scanTargets);
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    // Safety fallback so dynamically resized content can never stay hidden.
    const safetyTimer = window.setTimeout(() => {
      for (const el of root.querySelectorAll<HTMLElement>('.motion-pending')) {
        el.classList.add('motion-revealed');
        el.classList.remove('motion-pending');
        observer.unobserve(el);
      }
    }, 3500);
    fallbackTimers.push(safetyTimer);

    return () => {
      window.cancelAnimationFrame(rafScan);
      mutationObserver.disconnect();
      observer.disconnect();
      for (const timer of fallbackTimers) window.clearTimeout(timer);
      fallbackTimers = [];
    };
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden="true"
        className="site-scroll-track"
      >
        <div ref={progressRef} className="site-scroll-bar" />
      </div>
      <div key={pathname} ref={rootRef} className="site-page-transition">
        {children}
      </div>
    </>
  );
}
