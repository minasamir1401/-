import Link from 'next/link';
import { AskQuestionForm } from '@/components/AskQuestionForm';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';

export default function AskPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1
              className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--accent-burgundy)' }}
            >
              <SectionArtwork name="ask" />
              اسأل عن شبهة أو استفسار عقيدي
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              هل واجهتك شبهة كتابية أو سؤال حول العقيدة الأرثوذكسية أو الطقوس أو مقارنة الأديان ولم تجده بعد في الموسوعة؟ أرسل سؤالك هنا لمراجعته وإعداد رد موثق عليه.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/ai" className="brand-button text-xs">
              <SectionIcon name="ai" />
              اسأل المرشد الأرثوذكسي الفوري
            </Link>
            <Link href="/apologetics" className="media-action text-xs">
              <SectionIcon name="shield" />
              تصفح الشبهات المجاب عنها
            </Link>
          </div>
        </div>
      </div>

      <AskQuestionForm />

      <div className="card-manuscript p-6 grid gap-4 md:grid-cols-3 text-sm">
        <div className="space-y-1">
          <h2 className="font-bold" style={{ color: 'var(--accent-burgundy)' }}>١. ابحث أولاً في الموسوعة</h2>
          <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
            تضم صفحة الرد على الشبهات أكثر من 200 ملف وسؤال تفصيلي موثق في العقيدة والكتاب المقدس ومقارنة الأديان، مع ربط مباشر بتفاسير الآباء ومكتبة الكنيسة.
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold" style={{ color: 'var(--accent-burgundy)' }}>٢. اذكر الشاهد الكتابي</h2>
          <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
            تحديد اسم السفر ورقم الأصحاح والآية يساعد في تقديم شرح لغوي وآبائي دقيق داخل السياق.
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold" style={{ color: 'var(--accent-burgundy)' }}>٣. منهج الرد الأرثوذكسي</h2>
          <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
            نعتمد حصراً على النص الكتابي الأصلي، والتقليد الكنسي الأرثوذكسي، وأقوال الآباء المعتبرين دون جدل غير علمي.
          </p>
        </div>
      </div>
    </div>
  );
}
