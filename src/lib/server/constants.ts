import type { Prisma } from '@prisma/client';

export const OFFICIAL_SERMON_SOURCE = 'الموقع الرسمي لقداسة البابا شنودة الثالث';
export const ARCHIVE_ORTHODOX_SERMON_SOURCE = 'أرشيف العظات الأرثوذكسية الصوتية';

export const publicSermonsWhere: Prisma.SermonWhereInput = {
  mediaType: 'AUDIO_MP3',
  OR: [
    { sourceName: OFFICIAL_SERMON_SOURCE },
    { sourceName: ARCHIVE_ORTHODOX_SERMON_SOURCE },
    {
      sourceName: 'Internet Archive Audio',
      preacher: { name: { in: ['القمص مكاري يونان', 'Father Makary Younan__ابونا مكاري'] } },
      mediaUrl: { startsWith: 'https://archive.org/download/FatherMakary' },
    },
  ],
};

export const APOLOGETICS_DOMAINS = [
  { key: 'all', label: 'جميع المحاور' },
  { key: 'trinity-christology', label: 'الثالوث ولاهوت المسيح' },
  { key: 'scripture', label: 'الكتاب المقدس والمخطوطات والأبوكريفا' },
  { key: 'incarnation-salvation', label: 'التجسد والفداء والصليب والقيامة' },
  { key: 'atheism-science', label: 'الإلحاد ووجود الله والعلم' },
  { key: 'sectarian-heresies', label: 'اللاهوت المقارن والبدع الحديثة' },
  { key: 'church-history-patristics', label: 'التاريخ الكنسي والمجامع والآباء' },
  { key: 'comparative-religions', label: 'مقارنة الأديان والشبهات العامة' },
] as const;

export const FEATURED_DEFENSE_GROUPS = [
  {
    id: 'defense',
    title: 'الدفاع عن العقيدة الأرثوذكسية واللاهوت المقارن',
    description: 'أمهات الكتب في لاهوت المسيح والتجسد والفداء وقانون الإيمان والرد على البدع الحديثة.',
    slugs: [
      'لاهوت-المسيح-البابا-شنودة-الثالث',
      'طبيعة-المسيح-البابا-شنودة-الثالث',
      'تجسد-الكلمة-للقديس-أثناسيوس-الرسولي',
      'orthodox-salvation',
      'comparative-theology-one',
      'قانون-الإيمان',
      'modern-heresies',
      'بدعة-الخلاص-في-لحظة',
      'لماذا-نرفض-المطهر',
      'العقيدة-السليمة-في-مقابل-اللاطائفية',
    ],
  },
  {
    id: 'apologetics',
    title: 'الرد على الشبهات وصحة الكتاب المقدس',
    description: 'مراجع موثقة في الرد على الشبهات اللاهوتية والمخطوطات والأبوكريفا والإلحاد.',
    slugs: [
      'questions-on-christs-divinity',
      'أسئلة-حول-التثليث-والتوحيد',
      'أسئلة-حول-الصليب-والفداء',
      'الرد-على-الشكوك-الموجهة-للقيامة',
      'gospel-writing-and-transmission',
      'أسئلة-حول-صحة-الكتاب-المقدس',
      'مفهوم-الوحي-والعصمة-في-الكتاب-المقدس',
      'أبو-كريفا-العهد-الجديد-أناجيل-الطفولة-والآلام-ولماذا-رفضتها-الكنيسة',
      'الإلحاد-شبهات-والرد-عليها',
      'إنجيل-برنابا-المزعوم',
    ],
  },
] as const;
