import Link from 'next/link';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-4">
        <h1
          className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
          style={{ color: 'var(--accent-burgundy)' }}
        >
          <SectionArtwork name="beacon" />
          عن المنارة الأرثوذكسية ومنهجية العمل
        </h1>
        <p className="text-sm md:text-base leading-8 max-w-3xl" style={{ color: 'var(--text-muted)' }}>
          منصة قبطية أرثوذكسية عربية رقمية تُعنى بجمع التراث الكتابي والآبائي والليتورجي والدفاعي في مكان واحد منظم وموثق، يتيح القراءة السلسة والبحث العلمي السريع دون تشويش أو إعلانات.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card-manuscript p-6 space-y-3">
          <h2 className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionIcon name="bible" />
            الالتزام الكنسي والقانوني
          </h2>
          <ul className="list-disc ps-5 text-sm space-y-2 leading-7" style={{ color: 'var(--text-muted)' }}>
            <li>النص الكامل للكتاب المقدس بالترجمة البيروتية العربية المعتمدة (73 سفراً شاملة الأسفار القانونية الثانية).</li>
            <li>تفاسير آبائية معتمدة أصحاحاً بأصحاح بقلم القمص تادرس يعقوب ملطي والقمص أنطونيوس فكري.</li>
            <li>تنقية دقيقة للمكتبة والمقالات والعظات لضمان توافق جميع المصادر مع عقيدة الكنيسة القبطية الأرثوذكسية الموروثة من الآباء والمجامع المسكونية الثلاثة.</li>
          </ul>
        </section>

        <section className="card-manuscript p-6 space-y-3">
          <h2 className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionIcon name="shield" />
            أقسام المنارة الرئيسية
          </h2>
          <ul className="list-disc ps-5 text-sm space-y-1.5 leading-7" style={{ color: 'var(--text-muted)' }}>
            <li><Link href="/apologetics" className="underline font-semibold text-[var(--text-ink)]">الرد على الشبهات واللاهوت الدفاعي</Link>: ردود موثقة مرتبطة بالآيات والمراجع.</li>
            <li><Link href="/catechism" className="underline font-semibold text-[var(--text-ink)]">التعليم العقيدي الأرثوذكسي</Link>: قانون الإيمان، الأسرار السبعة، والمجامع.</li>
            <li><Link href="/commentaries" className="underline font-semibold text-[var(--text-ink)]">فهرس تفاسير الكتاب المقدس</Link>: تغطية منظمة لجميع الأسفار.</li>
            <li><Link href="/synaxarium" className="underline font-semibold text-[var(--text-ink)]">السنكسار القبطي</Link>: 13 شهراً قبطياً وسير القديسين والشهداء.</li>
            <li><Link href="/liturgy" className="underline font-semibold text-[var(--text-ink)]">الليتورجيا والأجبية والقطمارس</Link>: القداسات الثلاثة، التسبحة، والأجبية.</li>
          </ul>
        </section>
      </div>

      <section className="card-manuscript p-6 md:p-8 space-y-4">
        <h2 className="font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
          الأمانة العلمية وتوثيق المصادر
        </h2>
        <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
          تحفظ المنارة حقوق كل مؤلف وجهة كنسية منسوبة إليها النصوص أو التسجيلات، وتتيح القراءة المباشرة مع روابط مرجعية واضحة إلى المصادر الأصلية ومنها الموقع الرسمي لقداسة البابا شنودة الثالث، وموقع كنيسة الأنبا تكلا هيمانوت بالإسكندرية، وKatameros، وCopticChurch.net، وأرشيف التراث القبطي.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/ask" className="brand-button text-xs">
            <SectionIcon name="ask" />
            أرسل استفساراً أو شبهة
          </Link>
          <Link href="/search" className="media-action text-xs">
            <SectionIcon name="search" />
            البحث الشامل في المنارة
          </Link>
        </div>
      </section>
    </div>
  );
}
