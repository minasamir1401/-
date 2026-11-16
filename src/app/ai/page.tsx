import Link from 'next/link';
import { OrthodoxAiStudio } from '@/components/OrthodoxAiStudio';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'المرشد الأرثوذكسي بالذكاء الاصطناعي',
  description:
    'محاور ومساعد عقيدي ودفاعي قبطي أرثوذكسي مدعوم بمكتبة الكتاب المقدس وموسوعة الرد على الشبهات والمكتبة العربية للرد الموثق.',
  path: '/ai',
  keywords: ['المرشد الأرثوذكسي', 'اسأل AI الأرثوذكسي', 'مساعد لاهوتي ودفاعي'],
});

export default function OrthodoxAiPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1 className="section-page-title font-scripture text-3xl md:text-4xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
              <SectionArtwork name="ai" />
              المرشد الأرثوذكسي بالذكاء الاصطناعي
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              محاور ومساعد عقيدي ودفاعي مسيحي قبطي أرثوذكسي مدعوم بمكتبة الكتاب المقدس وموسوعة الشبهات والمكتبة الأرثوذكسية للرد الموثق على أسئلتك.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/apologetics" className="media-action text-xs">
              <SectionIcon name="shield" />
              موسوعة الشبهات
            </Link>
            <Link href="/ask" className="media-action text-xs">
              <SectionIcon name="ask" />
              نموذج الأسئلة للمراجعة
            </Link>
          </div>
        </div>
      </div>

      <OrthodoxAiStudio />
    </div>
  );
}
