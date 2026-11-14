'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { SectionArtwork } from './SectionArtwork';
import { SectionIcon } from './SectionIcon';

const DESKTOP_NAV_ROWS = [
  [
    { href: '/', icon: 'home', label: 'الرئيسية' },
    { href: '/bible', icon: 'bible', label: 'الكتاب المقدس' },
    { href: '/commentaries', icon: 'commentary', label: 'التفاسير' },
    { href: '/apologetics', icon: 'shield', label: 'الشبهات' },
    { href: '/catechism', icon: 'cross', label: 'العقيدة' },
    { href: '/explanations', icon: 'explanations', label: 'الشروحات' },
  ],
  [
    { href: '/library', icon: 'library', label: 'المكتبة' },
    { href: '/sermons', icon: 'sermons', label: 'العظات' },
    { href: '/videos', icon: 'videos', label: 'الفيديوهات' },
    { href: '/liturgy', icon: 'liturgy', label: 'الليتورجيا' },
    { href: '/synaxarium', icon: 'synaxarium', label: 'السنكسار' },
    { href: '/ask', icon: 'ask', label: 'اسأل عن شبهة' },
  ],
] as const;

const MOBILE_NAV_ITEMS = [
  { href: '/ai', icon: 'ai', label: 'اسأل AI الأرثوذكسي' },
  ...DESKTOP_NAV_ROWS[0],
  ...DESKTOP_NAV_ROWS[1],
  { href: '/about', icon: 'info', label: 'عن المنارة' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('orthodox-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('orthodox-theme', next ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    setMobileOpen(false);
  };

  return (
    <header className="site-header sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="site-shell site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-mark">
            <SectionArtwork name="beacon" className="w-7 h-7" size={64} />
          </span>
          <div>
            <strong>المنارة الأرثوذكسية</strong>
            <small>الكتاب المقدس • المكتبة • التفاسير • العظات</small>
          </div>
        </Link>

        <div className="header-tools">
          <form onSubmit={handleSearch} className="header-search">
            <input
              type="search"
              aria-label="ابحث في الموقع"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث في الآيات والكتب والعظات..."
              className="header-search-input"
            />
            <button type="submit" aria-label="بحث" className="header-search-submit">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              router.push('/search');
            }}
            aria-label="فتح البحث"
            className="header-icon-button header-search-toggle"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="تبديل الوضع الليلي"
            className="header-icon-button"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="القائمة"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="header-icon-button header-menu-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="site-header-nav-band">
        <div className="site-shell">
          <nav aria-label="التنقل الرئيسي" className="site-nav">
            {DESKTOP_NAV_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="site-nav-row">
                {row.map((item) => {
                  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                  return (
                    <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="site-mobile-menu border-t px-4 py-4 space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              aria-label="ابحث في الموقع"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث في الكتاب المقدس والكتب والعظات..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)' }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: 'var(--accent-burgundy)' }}
            >
              بحث
            </button>
          </form>
          <nav aria-label="التنقل على الشاشات الصغيرة" className="site-mobile-nav grid grid-cols-2 gap-2">
            {MOBILE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')) ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-lg text-xs border flex items-center gap-2"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <SectionIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
