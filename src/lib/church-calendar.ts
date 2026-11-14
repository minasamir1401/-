import { sectionHref } from './api-client';
import { normalizeMediaQuery } from './media-catalog';

const ritesSource = 'https://copticorthodox.church/الكنيسة-القبطية/coptic-rites/';
const hymnsSource = 'https://copticorthodox.church/الكنيسة-القبطية/coptic-music/';
const calendarSource = 'https://katameros.app/';
const monasterySource = 'https://copticorthodox.church/monasteries/دير-الشهيد-العظيم-مارجرجس-بالرزيقات/';
const georgeHymns = [
  { label: 'نص الدكسولوجية الأولى وتسجيلاتها', href: 'https://tasbeha.org/hymn_library/view/424' },
  { label: 'نص الدكسولوجية الثانية وتسجيلاتها', href: 'https://tasbeha.org/hymn_library/view/2030' },
];

export interface ChurchOccasion {
  id: string;
  title: string;
  kind: 'عيد' | 'صوم' | 'موسم' | 'تذكار' | 'احتفال محلي' | 'ألحان ومدائح';
  summary: string;
  start?: string;
  end?: string;
  aliases?: string;
  sources: { label: string; href: string }[];
  audio?: { src: string; credit: string };
  synaxarium?: boolean;
  relatedHymn?: string;
}

const george = 'مار جرجس ماري جرجس مار جرجيس ماري جرجي مارجرجي مارجرجس القديس جورجيوس';
const copticMonths = ['توت', 'بابه', 'هاتور', 'كيهك', 'طوبة', 'أمشير', 'برمهات', 'برمودة', 'بشنس', 'بؤونة', 'أبيب', 'مسرى', 'النسيء'];
const copticFormatter = new Intl.DateTimeFormat('en-u-ca-coptic-nu-latn', {
  timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric',
});
const cairoFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
});
const gregorianFormatter = new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
  timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
});
const arabicNumber = new Intl.NumberFormat('ar-EG', { useGrouping: false });

export function cairoToday() {
  const parts = cairoFormatter.formatToParts(new Date());
  return ['year', 'month', 'day'].map((field) => parts.find((part) => part.type === field)?.value).join('-');
}

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

function copticParts(iso: string) {
  const parts = copticFormatter.formatToParts(new Date(iso + 'T00:00:00Z'));
  return ['day', 'month', 'year'].map((field) => Number(parts.find((part) => part.type === field)?.value));
}

export function copticDateLabel(iso: string) {
  const [day, month, year] = copticParts(iso);
  return `${arabicNumber.format(day)} ${copticMonths[month - 1]} ${arabicNumber.format(year)} ش`;
}

function gregorianDay(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.toISOString().slice(0, 10);
}

export function formatOccasionDate(iso: string) {
  return gregorianFormatter.format(new Date(iso + 'T00:00:00Z'));
}

export const georgeDoxology: ChurchOccasion = {
  id: 'st-george-doxology',
  title: 'دكسولوجية مار جرجس',
  kind: 'ألحان ومدائح',
  summary: 'من دكسولوجيات الشهيد مار جرجس في الطقس القبطي. استمع إلى اللحن، واقرأ النص بالعربية والقبطية في مكتبة الألحان.',
  aliases: `${george} تسبحة تسبيح تسبيحه تمجيد مديح مديحة لحن ذكصولوجية`,
  sources: georgeHymns,
  audio: {
    src: 'https://www.saintcyrilcoc.org/wp-content/uploads/2019/12/george.mp3',
    credit: 'كنيسة القديس كيرلس الإسكندري القبطية الأرثوذكسية',
  },
};

export const churchHymns: ChurchOccasion[] = [
  georgeDoxology,
  {
    id: 'mary-doxology', title: 'دكسولوجية السيدة العذراء في باكر', kind: 'ألحان ومدائح',
    summary: 'دكسولوجية «طوباكِ أنتِ يا مريم» في رفع بخور باكر.',
    aliases: 'تمجيد العذراء مريم العذرا طوباك نهضة تسبحة مديحة لحن',
    sources: [{ label: 'نص الدكسولوجية وتسجيلاتها', href: 'https://tasbeha.org/hymn_library/view/23' }],
  },
  {
    id: 'mina-doxology', title: 'دكسولوجية مار مينا العجائبي', kind: 'ألحان ومدائح',
    summary: 'الدكسولوجية الأولى للشهيد مار مينا في مكتبة الألحان القبطية.',
    aliases: 'مارمينا تمجيد نهضة مديحة لحن تسبحة',
    sources: [{ label: 'نص دكسولوجية مار مينا', href: 'https://tasbeha.org/hymn_library/view/1394' }],
  },
  {
    id: 'golgotha-hymn', title: 'لحن غولغوثا', kind: 'ألحان ومدائح',
    summary: 'لحن الدفن في ختام الجمعة العظيمة، في الساعة الثانية عشرة من البصخة المقدسة.',
    aliases: 'غولغوتا جلجثة جلجثه الجمعة الكبيرة أسبوع الآلام لحن الدفن',
    sources: [{ label: 'نص لحن غولغوثا وتسجيله', href: 'https://tasbeha.org/hymn_library/view/209' }],
  },
  {
    id: 'resurrection-hymn', title: 'لحن المسيح قام', kind: 'ألحان ومدائح',
    summary: '«إخرستوس أنستي»، لحن القيامة باليونانية في الطقس القبطي.',
    aliases: 'عيد القيامة ألحان القيامه الخماسين اخرستوس انستي بالموت داس الموت',
    sources: [{ label: 'نص لحن المسيح قام وتسجيلاته', href: 'https://tasbeha.org/hymn_library/view/372' }],
  },
];

export const georgeCelebration: ChurchOccasion = {
  id: 'st-george-rezeikat',
  title: 'نهضة مار جرجس بدير الرزيقات',
  kind: 'احتفال محلي',
  summary: 'احتفال الدير بشفيعه بمناسبة تذكار تكريس كنيسته باللد. برنامج الصلوات والقداسات والزفات ومواعيدها يعلنها الدير لكل سنة.',
  aliases: `${george} النهضة النهضا النهضه نهضا مولد عيد زفة رزيقات الاقصر`,
  relatedHymn: georgeDoxology.id,
  sources: [{ label: 'صفحة الدير على موقع الكنيسة القبطية', href: monasterySource }],
};

const kiahk: ChurchOccasion = {
  id: 'kiahk-praises',
  title: 'تسبحة كيهك «سبعة وأربعة»',
  kind: 'موسم',
  summary: 'تسابيح شهر كيهك استعدادًا لعيد الميلاد. يشير الاسم إلى السبع ثيؤطوكيات والأربعة هوسات.',
  aliases: 'كيهكي كيهكى سبعة واربعة 7 و4 تسبيح سهرات مدائح الميلاد',
  sources: [
    { label: 'الألحان والموسيقى القبطية', href: hymnsSource },
    { label: 'استمع لألحان سبعة وأربعة للمعلم إبراهيم عياد', href: 'https://tasbeha.org/mp3/Hymns/Fasts/Nativity/Kiahk_Midnight_Praises%2C_Ibrahim_Ayad.html' },
  ],
};

function featuredOccasions(year: number): ChurchOccasion[] {
  const kiahkEnd = gregorianDay(year + 1, 1, 6);
  return [
    {
      id: 'st-george-martyrdom', title: 'استشهاد مار جرجس الروماني', kind: 'تذكار',
      start: synaxariumDayForYear(year, 8, 23), synaxarium: true, relatedHymn: georgeDoxology.id,
      summary: 'تذكار استشهاد الشهيد مار جرجس الروماني في ٢٣ برمودة.',
      aliases: `${george} عيد شهادة أمير الشهداء`,
      sources: [{ label: 'سنكسار ٢٣ برمودة', href: 'https://copticchurch.net/synaxarium/ar/8_23' }],
    },
    {
      id: 'st-george-lydda', title: 'تكريس كنيسة مار جرجس باللد', kind: 'تذكار',
      start: synaxariumDayForYear(year, 3, 7), synaxarium: true, relatedHymn: georgeDoxology.id,
      summary: 'تذكار تكريس الكنيسة باسم الشهيد مار جرجس في اللد في ٧ هاتور.',
      aliases: `${george} تدشين عيد الرزيقات`,
      sources: [{ label: 'سنكسار ٧ هاتور', href: 'https://copticchurch.net/synaxarium/ar/3_7' }],
    },
    { ...kiahk, start: synaxariumDayForYear(year, 4, 1), end: kiahkEnd },
    ...(year === 2026 ? [{
      ...georgeCelebration,
      start: '2026-11-10',
      end: '2026-11-16',
      sources: [...georgeCelebration.sources, { label: 'تغطية برنامج احتفال ٢٠٢٦', href: 'https://www.elwatannews.com/news/details/8395294' }],
    }] : []),
  ];
}

interface FeedOccasion {
  id: number;
  date?: string;
  start?: string;
  end?: string;
  name: string;
  description?: string;
}

async function loadFeed(kind: 'feasts' | 'fasts', year: number): Promise<FeedOccasion[] | null> {
  try {
    const res = await fetch(`https://api.katameros.app/${kind}/${year}/3`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const items: unknown = await res.json();
    return Array.isArray(items) && items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

const feastNames: Record<number, [string, string]> = {
  1: ['عيد الميلاد المجيد', 'الكريسماس ميلاد المسيح'],
  4: ['أحد الشعانين', 'أحد السعف أحد الزعف أحد الخوص دخول أورشليم'],
  9: ['الجمعة العظيمة', 'الجمعة الكبيرة جمعة الصلب'],
  18: ['عيد الغطاس', 'الظهور الإلهي معمودية المسيح'],
  22: ['عيد القيامة المجيد', 'عيد البصخة الفصح المسيحي عيد الفصح'],
  24: ['سبت الفرح', 'سبت النور أبو غلامسيس'],
  25: ['عيد العنصرة', 'عيد حلول الروح القدس عيد الخمسين السجدة'],
  30: ['عيد السيدة العذراء مريم', 'إعلان إصعاد جسد العذراء عيد العذرا'],
};
const feastHymns: Partial<Record<number, string>> = { 9: 'golgotha-hymn', 22: 'resurrection-hymn', 30: 'mary-doxology' };
const fastHymns: Partial<Record<number, string>> = { 5: 'mary-doxology' };

function feedDates(items: FeedOccasion[] | null, kind: 'عيد' | 'صوم'): ChurchOccasion[] {
  return (items ?? []).flatMap((item) => {
    const start = (item.date ?? item.start)?.slice(0, 10) ?? '';
    const end = item.end?.slice(0, 10);
    if (!isCalendarDate(start) || (end && (!isCalendarDate(end) || end < start)) || !item.name) return [];
    if (kind === 'عيد' && item.id === 14) return []; // Listed as a single date range in the fasts feed.
    const [title, aliases] = kind === 'عيد' ? feastNames[item.id] ?? [item.name, ''] : [item.name, ''];
    return [{
      id: `${kind === 'عيد' ? 'feast' : 'fast'}-${item.id}-${start}`, kind, start, end, title,
      aliases: kind === 'صوم' && item.id === 2 ? 'صوم يونان نينوي' : aliases,
      summary: kind === 'صوم' && item.id === 3 ? 'فترة الصوم الكبير التي تسبق سبت لعازر وأسبوع الآلام في ترتيب التقويم.' : item.description ?? '',
      relatedHymn: kind === 'عيد' ? feastHymns[item.id] : fastHymns[item.id],
      sources: [{ label: 'تقويم القطمارس القبطي', href: calendarSource }],
    }];
  });
}

export async function loadChurchYear(year: number) {
  const [feasts, fasts] = await Promise.all([loadFeed('feasts', year), loadFeed('fasts', year)]);
  const events = [...feedDates(feasts, 'عيد'), ...feedDates(fasts, 'صوم'), ...featuredOccasions(year)];
  const palm = events.find((event) => event.id.startsWith('feast-4-'));
  const holySaturday = events.find((event) => event.id.startsWith('feast-24-'));
  if (palm && holySaturday) {
    events.push({
      id: `holy-week-${year}`, title: 'أسبوع الآلام', kind: 'موسم', aliases: 'البصخة المقدسة طقس البصخة',
      start: palm.start, end: holySaturday.start,
      relatedHymn: 'golgotha-hymn',
      summary: 'من أحد الشعانين إلى سبت الفرح، مع قراءات وألحان البصخة المقدسة.',
      sources: [{ label: 'طقس الكنيسة القبطية', href: ritesSource }],
    });
  }
  const resurrection = events.find((event) => event.id.startsWith('feast-22-'));
  const pentecost = events.find((event) => event.id.startsWith('feast-25-'));
  if (resurrection && pentecost) {
    events.push({
      id: `holy-fifty-${year}`, title: 'الخمسون المقدسة', kind: 'موسم', aliases: 'الخماسين المقدسة موسم القيامة',
      start: resurrection.start, end: pentecost.start, relatedHymn: 'resurrection-hymn',
      summary: 'الفترة من عيد القيامة إلى عيد العنصرة، وتشمل عيد الصعود.',
      sources: [{ label: 'طقس الكنيسة القبطية', href: ritesSource }],
    });
  }
  return { events: events.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? '')), complete: !!(feasts && fasts) };
}

export async function occasionsForDate(date: string) {
  const year = Number(date.slice(0, 4));
  const [calendar, preceding] = await Promise.all([
    loadChurchYear(year),
    year > 1 && date.slice(5, 7) === '01' ? loadChurchYear(year - 1) : null,
  ]);
  return {
    ...calendar,
    today: [...(preceding?.events ?? []), ...calendar.events].filter((event) => isOccasionOnDate(event, date)),
  };
}

export function isOccasionOnDate(event: ChurchOccasion, date: string) {
  return !!event.start && event.start <= date && (event.end ?? event.start) >= date;
}

export function occasionHref(event: ChurchOccasion, date = event.start) {
  return event.start
    ? sectionHref('/liturgy', { date: date ?? event.start }) + `#${event.id}`
    : `/liturgy#${event.id}`;
}

function normalizeOccasion(value: string) {
  return normalizeMediaQuery(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/(^| )مار\s*(?:ي\s*)?جرج(?:س|يس|ي)(?= |$)/g, '$1مارجرجس')
    .replace(/(^| )(?:ال)?نهض[ها](?= |$)/g, '$1نهضه')
    .trim();
}

export function matchesOccasion(event: Pick<ChurchOccasion, 'title' | 'aliases'>, query: string) {
  const terms = normalizeOccasion(query);
  const text = normalizeOccasion(`${event.title} ${event.aliases ?? ''}`);
  return terms.length >= 2 && terms.split(' ').every((word) => text.includes(word));
}

export interface SynaxariumReading {
  storyId?: number | null;
  title?: string | null;
  displayTitle?: string | null;
}

export function synaxariumReadings(sections: Array<{ subSections?: Array<{ readings?: SynaxariumReading[] }> }>) {
  return sections.flatMap((section) => section.subSections ?? [])
    .flatMap((sub) => sub.readings ?? [])
    .filter((reading) => reading.storyId && (reading.displayTitle || reading.title));
}

export const synaxariumIndex = 'https://copticchurch.net/synaxarium/all/ar';

export function synaxariumSource(iso: string) {
  const [day, month] = copticParts(iso);
  return `https://copticchurch.net/synaxarium/ar/${month}_${day}`;
}

export function synaxariumDayForYear(year: number, month: number, day: number) {
  // The Coptic year begins in September. Each lookup starts near the middle of the preceding Gregorian month.
  const approximateMonths = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const start = approximateMonths[month - 1];
  if (!start || day < 1 || day > (month === 13 ? 6 : 30)) return undefined;
  for (let offset = -10; offset <= 45; offset++) {
    const iso = gregorianDay(year, start, offset + 1);
    const [copticDay, copticMonth] = copticParts(iso);
    if (iso.startsWith(`${year}-`) && copticDay === day && copticMonth === month) return iso;
  }
  return undefined;
}
