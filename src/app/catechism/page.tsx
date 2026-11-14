import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';

const CREED_CLAUSES = [
  {
    clause: 'بالحقيقة نؤمن بإله واحد، الله الآب ضابط الكل، خالق السماء والأرض، ما يُرى وما لا يُرى.',
    explanation: 'إقرار الوحدانية المطلقة: الله واحد في جوهره وطبيعته، وهو ينبوع اللاهوت وخالق الكون من العدم.',
    scripture: { label: 'تثنية 6: 4 / عبرانيين 11: 3', href: '/bible/deuteronomy/6' },
  },
  {
    clause: 'نؤمن برب واحد يسوع المسيح، ابن الله الوحيد، المولود من الآب قبل كل الدهور، نور من نور، إله حق من إله حق، مولود غير مخلوق، مساوٍ للآب في الجوهر، الذي به كان كل شيء.',
    explanation: 'ولادة أزلية روحية كولادة النور من النور والشعاع من الشمس بلا انفصال ولا أسبقية زمنية؛ فالابن مساوٍ للآب في الجوهر (هوموأوسيوس).',
    scripture: { label: 'يوحنا 1: 1-3 / عبرانيين 1: 3', href: '/bible/john/1' },
  },
  {
    clause: 'هذا الذي من أجلنا نحن البشر ومن أجل خلاصنا نزل من السماء، وتجسد من الروح القدس ومن مريم العذراء، وتأنس.',
    explanation: 'أخذ الابن الكلمة جسداً حقيقياً كاملاً بنفس عاقلة من والدة الإله القديسة مريم، واتحد اللاهوت بالناسوت اتحاداً حقيقياً بغير اختلاط ولا امتزاج ولا تغيير.',
    scripture: { label: 'يوحنا 1: 14 / 1 تيموثاوس 3: 16', href: '/bible/john/1' },
  },
  {
    clause: 'وصلب عنا على عهد بيلاطس البنطي، وتألم وقُبر وقام من الأموات في اليوم الثالث كما في الكتب، وصعد إلى السموات وجلس عن يمين أبيه، وأيضاً يأتي في مجده ليدين الأحياء والأموات.',
    explanation: 'فداء حقيقي على الصليب مات فيه بالجسد بينما لاهوته لم يفارق ناسوته لحظة واحدة، ثم قام بجسده الممجد فاتحاً باب القيامة والرجاء الأبدي.',
    scripture: { label: '1 كورنثوس 15: 3-20', href: '/bible/1-corinthians/15' },
  },
  {
    clause: 'نعم نؤمن بالروح القدس الرب المحيي، المنبثق من الآب، نسجد له ونمجده مع الآب والابن، الناطق في الأنبياء.',
    explanation: 'الروح القدس هو الأقنوم الثالث، مساوٍ للآب والابن في الألوهة والسجود، ينبثق من الآب وحده كما علمنا الرب يسوع في الإنجيل.',
    scripture: { label: 'يوحنا 15: 26 / أعمال 5: 3-4', href: '/bible/john/15' },
  },
  {
    clause: 'وبكنيسة واحدة مقدسة جامعة رسولية، ونعترف بمعمودية واحدة لمغفرة الخطايا، وننتظر قيامة الأموات وحياة الدهر الآتي. آمين.',
    explanation: 'الكنيسة جسد المسيح الواحد المحفوظ بالتقليد الرسولي والخلافة الرسولية، وفيها نال المؤمنون الخلاص والولادة الجديدة بالأسرار المقدسة.',
    scripture: { label: 'أفسس 4: 4-6 / متى 28: 19', href: '/bible/ephesians/4' },
  },
];

const SEVEN_SACRAMENTS = [
  { name: '١. سر المعمودية المقدسة', ref: 'يو 3: 5 / رو 6: 3-4', href: '/bible/john/3', summary: 'الولادة الجديدة من الماء والروح، وموت الإنسان العتيق مع المسيح والقيامة في جدة الحياة.' },
  { name: '٢. سر الميرون المقدس (المسحة)', ref: '1 يو 2: 20، 27 / أع 8: 17', href: '/bible/acts/8', summary: 'مسحة الروح القدس التي يثبّت بها المعمد في الحياة الروحية ويدشن بها هيكل الله الحي.' },
  { name: '٣. سر التوبة والاعتراف', ref: 'يو 20: 22-23 / يع 5: 16', href: '/bible/john/20', summary: 'تجديد عهد المعمودية بالإقرار الصادق بالخطايا أمام الأب الكاهن ونوال الحل بسلطان المسيح.' },
  { name: '٤. سر الأفخارستيا (التناول)', ref: 'يو 6: 53-56 / 1 كو 11: 23-29', href: '/bible/john/6', summary: 'سر الأسرار؛ فيه يتحول الخبز والخمر بالروح القدس إلى جسد الرب ودمه الحقيقيين للثبات فيه.' },
  { name: '٥. سر مسحة المرضى (القنديل)', ref: 'يع 5: 14-15 / مر 6: 13', href: '/bible/james/5', summary: 'صلاة الكنيسة ومسح المؤمنين بالزيت المقدس لشفاء النفس والجسد وغفران الخطايا.' },
  { name: '٦. سر الزيجة المقدس', ref: 'أف 5: 25-32 / مت 19: 5-6', href: '/bible/ephesians/5', summary: 'رباط روحي مقدس يوحد الرجل والمرأة بعمل الروح القدس كصورة لاتحاد المسيح بالكنيسة.' },
  { name: '٧. سر الكهنوت المقدس', ref: 'أع 20: 28 / 1 تي 4: 14 / عب 5: 4', href: '/bible/acts/20', summary: 'موهبة روحية تُمنح بوضع يد الأسقف في تسلسل رسولي متصل لخدمة الكلمة والأسرار والرعاية.' },
];

const COUNCILS = [
  {
    name: 'مجمع نيقية المسكوني الأول (325 م)',
    place: 'نيقية - بحضور 318 أسقفاً',
    issue: 'بدعة آريوس الذي أنكر أزلية الابن وادعى أنه مخلوق.',
    decision: 'صياغة الجزء الأول من قانون الإيمان وإقرار أن الابن «مساوٍ للآب في الجوهر» (هوموأوسيوس)، بقيادة البابا ألكسندروس والشمامسة أثناسيوس.',
  },
  {
    name: 'مجمع القسطنطينية المسكوني الثاني (381 م)',
    place: 'القسطنطينية - بحضور 150 أسقفاً',
    issue: 'بدعة مقدونيوس الذي أنكر لاهوت الروح القدس.',
    decision: 'إتمام قانون الإيمان بإقرار لاهوت الروح القدس «الرب المحيي المنبثق من الآب»، وإدانة الأبولينارية والسابيلية.',
  },
  {
    name: 'مجمع أفسس المسكوني الثالث (431 م)',
    place: 'أفسس - بحضور 200 أسقف برئاسة القديس كيرلس الكبير',
    issue: 'بدعة نسطور الذي فصل بين المسيح الإله والمسيح الإنسان وأنكر لقب والدة الإله (ثيؤطوكوس).',
    decision: 'تثبيت وحدة شخص المسيح وأقنومه الإلهي المتجسد («طبيعة واحدة متجسدة لله الكلمة») وإقرار لقب الثيؤطوكوس للسيدة العذراء.',
  },
];

export default function CatechismPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="card-manuscript section-page-banner p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1
              className="section-page-title font-scripture text-3xl md:text-4xl font-bold"
              style={{ color: 'var(--accent-burgundy)' }}
            >
              <SectionArtwork name="catechism" />
              التعليم العقيدي وأساسيات الإيمان القبطي الأرثوذكسي
            </h1>
            <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              عرض منهجي مبسط وموثق لركائز الإيمان الأرثوذكسي: قانون الإيمان النيقاوي القسطنطيني، الأسرار الكنسية السبعة، المجامع المسكونية، واللاهوت المقارن.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/apologetics" className="brand-button text-xs">
              <SectionIcon name="shield" />
              قسم الرد على الشبهات
            </Link>
            <Link href="/library?category=theology-and-dogma" className="media-action text-xs">
              <SectionIcon name="library" />
              كتب العقيدة في المكتبة
            </Link>
          </div>
        </div>
      </div>

      {/* Section 1: Nicene Creed */}
      <section className="card-manuscript p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <h2 className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionIcon name="cross" />
            أولاً: قانون الإيمان النيقاوي - القسطنطيني
          </h2>
          <Link href="/apologetics/trinity-monotheism-not-three-gods" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
            دراسة حول التوحيد والثالوث
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CREED_CLAUSES.map((item, idx) => (
            <article key={idx} className="rounded-lg border p-5 space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
              <p className="font-scripture text-lg font-bold leading-relaxed" style={{ color: 'var(--heading-ink)' }}>
                «{item.clause}»
              </p>
              <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
                {item.explanation}
              </p>
              <Link href={item.scripture.href} className="inline-block text-xs font-semibold underline" style={{ color: 'var(--accent-burgundy)' }}>
                الشاهد: {item.scripture.label}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Seven Sacraments */}
      <section className="card-manuscript p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <h2 className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionIcon name="chalice" />
            ثانياً: أسرار الكنيسة السبعة المقدسة
          </h2>
          <Link href="/explanations?category=church-rites-feasts" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
            مقالات الطقوس والأسرار
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEVEN_SACRAMENTS.map((s) => (
            <div key={s.name} className="rounded-lg border p-4 space-y-2" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
              <h3 className="font-bold text-base" style={{ color: 'var(--accent-burgundy)' }}>{s.name}</h3>
              <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>{s.summary}</p>
              <Link href={s.href} className="inline-block text-xs underline font-semibold" style={{ color: 'var(--text-ink)' }}>
                {s.ref}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Councils & Christology */}
      <section className="card-manuscript p-6 md:p-8 space-y-5">
        <h2 className="section-page-title font-scripture text-2xl font-bold border-b pb-3" style={{ borderColor: 'var(--border-hairline)', color: 'var(--accent-burgundy)' }}>
          <SectionIcon name="book" />
          ثالثاً: المجامع المسكونية الثلاثة والإيمان الخلقيدوني الميافيزي
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {COUNCILS.map((c) => (
            <article key={c.name} className="rounded-lg border p-5 space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>{c.place}</div>
              <h3 className="font-scripture text-lg font-bold">{c.name}</h3>
              <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}><strong>التحدي:</strong> {c.issue}</p>
              <p className="text-xs leading-6"><strong>قرار المجمع:</strong> {c.decision}</p>
            </article>
          ))}
        </div>

        <div className="rounded-lg border p-5 space-y-2" style={{ borderColor: 'var(--accent-gold)', backgroundColor: 'var(--bg-surface-muted)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--accent-burgundy)' }}>
            لماذا ترفض الكنيسة القبطية صيغة "الطبيعتين المنفصلتين" في خلقيدونية؟
          </h3>
          <p className="text-sm leading-7">
            الكنيسة القبطية الأرثوذكسية ليست «مونوفيزية» (التي تقول بابتلاع الناسوت في اللاهوت كما علّم أوطاخي وقد حرمته الكنيسة)، بل هي «ميافيزية» تلتزم بعبارة القديس كيرلس الكبير: «طبيعة واحدة لله الكلمة المتجسد» — أي اتحاد حقيقي لا يفترق بين لاهوت كامل وناسوت كامل في شخص واحد بغير اختلاط ولا امتزاج ولا تغيير ولا انفصال.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/apologetics/coptic-miaphysitism-vs-chalcedon" className="text-xs font-bold underline" style={{ color: 'var(--accent-burgundy)' }}>
              اقرأ التحقيق العقيدي المفصل حول طبيعة المسيح
            </Link>
            <Link href="/library?q=طبيعة+المسيح" className="text-xs font-bold underline" style={{ color: 'var(--accent-burgundy)' }}>
              تصفح كتاب طبيعة المسيح للبابا شنودة الثالث
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: Comparative Theology */}
      <section className="card-manuscript p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <h2 className="section-page-title font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionIcon name="shield" />
            رابعاً: مقارنة التعليم الأرثوذكسي بالبدع والمذاهب الأخرى
          </h2>
          <Link href="/apologetics?domain=sectarian-heresies" className="text-xs underline" style={{ color: 'var(--accent-burgundy)' }}>
            جميع ملفات اللاهوت المقارن
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-5 space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <h3 className="font-bold text-base" style={{ color: 'var(--accent-burgundy)' }}>النقاط الخلافية مع التعليم البروتستانتي</h3>
            <ul className="list-disc ps-5 text-xs space-y-1.5 leading-6" style={{ color: 'var(--text-muted)' }}>
              <li><Link href="/apologetics/salvation-orthodoxy-vs-instant-salvation-protestant" className="underline text-[var(--text-ink)] font-semibold">الخلاص في لحظة مقابل الإيمان العامل بالمحبة والأسرار</Link></li>
              <li><Link href="/apologetics/priesthood-and-confession-sacrament" className="underline text-[var(--text-ink)] font-semibold">الكهنوت والسر الرسولي والتوبة والاعتراف</Link></li>
              <li><Link href="/apologetics/icons-saints-intercession-not-idolatry" className="underline text-[var(--text-ink)] font-semibold">شفاعة السيدة العذراء والقديسين وإكرام الأيقونات</Link></li>
              <li><Link href="/apologetics/apostolic-tradition-vs-sola-scriptura" className="underline text-[var(--text-ink)] font-semibold">سلطان التقليد الرسولي والأسفار القانونية الثانية</Link></li>
            </ul>
          </div>

          <div className="rounded-lg border p-5 space-y-2.5" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}>
            <h3 className="font-bold text-base" style={{ color: 'var(--accent-burgundy)' }}>النقاط الخلافية مع الكاثوليكية والبدع الحديثة</h3>
            <ul className="list-disc ps-5 text-xs space-y-1.5 leading-6" style={{ color: 'var(--text-muted)' }}>
              <li><Link href="/apologetics/rejection-of-purgatory-and-filioque" className="underline text-[var(--text-ink)] font-semibold">لماذا ترفض الكنيسة الأرثوذكسية عقيدة المطهر والعصمة البابوية؟</Link></li>
              <li>انبثاق الروح القدس من الآب فقط (حسب يو 15: 26 والمجامع المسكونية دون إضافة Filioque)</li>
              <li><Link href="/apologetics/jehovah-witnesses-and-adventists-heresies" className="underline text-[var(--text-ink)] font-semibold">الرد على شهود يهوه والأدفنتست السبتيين في ألوهية المسيح ويوم الرب</Link></li>
              <li><Link href="/library?category=orthodox-defense" className="underline text-[var(--accent-burgundy)] font-semibold inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> تصفح جميع كتب الدفاع العقيدي</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
