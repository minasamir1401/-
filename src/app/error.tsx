'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="max-w-2xl mx-auto px-4 py-14">
      <div className="card-manuscript p-8 space-y-4">
        <h1 className="font-scripture text-3xl font-bold">تعذّر تحميل الصفحة</h1>
        <p className="media-muted">المحتوى غير متاح مؤقتًا. جرّب مرة أخرى.</p>
        <div className="flex gap-2 flex-wrap">
          <button className="media-action media-action-active" type="button" onClick={reset}>إعادة المحاولة</button>
          <Link className="media-action" href="/">الصفحة الرئيسية</Link>
        </div>
      </div>
    </section>
  );
}
