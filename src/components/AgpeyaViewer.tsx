'use client';

import { SectionIcon } from './SectionIcon';
import { useState } from 'react';
import agpeya from '@/data/agpeya/ar.json';

const HOURS = [
  { id: 'prime', label: 'صلاة باكر' },
  { id: 'terce', label: 'الساعة الثالثة' },
  { id: 'sext', label: 'الساعة السادسة' },
  { id: 'none', label: 'الساعة التاسعة' },
  { id: 'vespers', label: 'صلاة الغروب' },
  { id: 'compline', label: 'صلاة النوم' },
  { id: 'midnight', label: 'صلاة نصف الليل' },
] as const;

const MIDNIGHT_WATCHES = [
  { id: 'midnightFirst', label: 'الخدمة الأولى' },
  { id: 'midnightSecond', label: 'الخدمة الثانية' },
  { id: 'midnightThird', label: 'الخدمة الثالثة' },
] as const;

const prayers: Record<string, { title: string; text: string }> = agpeya.prayers;

function PrayerText({ ids }: { ids: string[] }) {
  return (
    <div className="space-y-5">
      {ids.map((id, index) => {
        const { title, text } = prayers[id];
        return (
          <div key={`${id}-${index}`} className="border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
            {title && <h4 className="mb-2 text-base font-bold" style={{ color: 'var(--accent-burgundy)' }}>{title}</h4>}
            <p className="font-scripture whitespace-pre-line text-xl leading-loose">{text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AgpeyaViewer() {
  const [hour, setHour] = useState<(typeof HOURS)[number]['id']>('prime');
  const current = HOURS.find((item) => item.id === hour)!;

  return (
    <section id="agpeya" aria-labelledby="agpeya-heading" className="card-manuscript p-5 md:p-6 space-y-5 scroll-mt-24">
      <h2 id="agpeya-heading" className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
        <SectionIcon name="agpeya" />الأجبية المقدسة (صلوات السواعي)
      </h2>
      <div role="group" aria-label="اختر ساعة الصلاة" className="flex flex-wrap gap-2">
        {HOURS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={hour === item.id}
            aria-controls="agpeya-prayer"
            onClick={() => setHour(item.id)}
            className={`media-action ${hour === item.id ? 'media-action-active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <article id="agpeya-prayer" lang="ar" dir="rtl" aria-labelledby="agpeya-prayer-heading" className="space-y-4">
        <h3 id="agpeya-prayer-heading" className="font-scripture text-2xl font-bold" aria-live="polite">{current.label}</h3>
        {hour === 'midnight' ? MIDNIGHT_WATCHES.map((watch, index) => (
          <details key={watch.id} open={index === 0} className="card-manuscript p-4">
            <summary className="cursor-pointer font-bold">{watch.label}</summary>
            <div className="pt-4"><PrayerText ids={agpeya.hours[watch.id]} /></div>
          </details>
        )) : <PrayerText ids={agpeya.hours[hour]} />}
      </article>

      <p className="media-muted text-xs">
        مصدر النص العربي{' '}
        <a href="https://github.com/abanoubha/agpeya/tree/6e7994e25118724133a692054fec86a5e555ecc4"
          target="_blank" rel="noreferrer" className="underline">مشروع الأجبية المفتوح المصدر</a>
      </p>
    </section>
  );
}
