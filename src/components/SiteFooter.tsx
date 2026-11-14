import Link from 'next/link';
import { SectionArtwork } from './SectionArtwork';
import { SectionIcon } from './SectionIcon';

export function SiteFooter() {
  return (
    <footer className="site-footer mt-6 border-t py-7">
      <div className="site-shell grid gap-6 md:grid-cols-3 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-scripture text-xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <span className="site-brand-mark"><SectionArtwork name="beacon" className="w-8 h-8" size={64} /></span>
            <span>المنارة الأرثوذكسية</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            منصة قبطية أرثوذكسية شاملة تجمع الكتاب المقدس، التفاسير الآبائية، مكتبة الكتب العربية للقراءة والتحميل، العظات الصوتية، والقطمارس اليومي.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold"><SectionIcon name="layers" />الأقسام الرئيسية</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc ps-5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <li><Link href="/bible" className="hover:underline">الكتاب المقدس الكامل (73 سفراً)</Link></li>
            <li><Link href="/commentaries" className="hover:underline">فهرس تفاسير الكتاب المقدس</Link></li>
            <li><Link href="/apologetics" className="hover:underline">الرد على الشبهات والدفاعيات</Link></li>
            <li><Link href="/ai" className="hover:underline">المرشد الأرثوذكسي الذكي (Gemini)</Link></li>
            <li><Link href="/catechism" className="hover:underline">التعليم العقيدي الأرثوذكسي</Link></li>
            <li><Link href="/library" className="hover:underline">المكتبة العربية والكتب الرقمية</Link></li>
            <li><Link href="/explanations" className="hover:underline">الشروحات والمقالات</Link></li>
            <li><Link href="/sermons" className="hover:underline">العظات والتأملات الصوتية</Link></li>
            <li><Link href="/videos" className="hover:underline">فيديوهات وشرح وكتب الدفاع</Link></li>
            <li><Link href="/liturgy" className="hover:underline">القطمارس والخولاجي والأجبية</Link></li>
            <li><Link href="/synaxarium" className="hover:underline">السنكسار القبطي (13 شهراً)</Link></li>
            <li><Link href="/ask" className="hover:underline">اسأل عن شبهة أو سؤال</Link></li>
            <li><Link href="/about" className="hover:underline">عن المنارة الأرثوذكسية</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold"><SectionIcon name="layers" />مصادر المحتوى</h3>
          <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
            تُنسب البيانات إلى مصادرها الأرثوذكسية الموثوقة: Bolls.life للنص الكتابي بالأسفار القانونية الثانية، Katameros API للقطمارس، CopticChurch.net للسنكسار الكامل، الموقع الرسمي لقداسة البابا شنودة الثالث، وموقع الأنبا تكلا هيمانوت للتفاسير والكتب الدفاعية والليتورجية، وأرشيف الإنترنت والكنوز القبطية.
          </p>
        </div>
      </div>
    </footer>
  );
}
