import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-14">
      <div className="card-manuscript p-8 space-y-4">
        <h1 className="font-scripture text-3xl font-bold">الصفحة غير موجودة</h1>
        <p className="media-muted">قد يكون الرابط تغيّر أو أن المحتوى لم يعد متاحًا.</p>
        <div className="flex gap-2 flex-wrap">
          <Link className="media-action media-action-active" href="/">الصفحة الرئيسية</Link>
          <Link className="media-action" href="/search">ابحث في الموقع</Link>
        </div>
      </div>
    </section>
  );
}
