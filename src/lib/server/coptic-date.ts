export const COPTIC_MONTHS = [
  { month: 1, nameAr: 'توت', days: 30 },
  { month: 2, nameAr: 'بابة', days: 30 },
  { month: 3, nameAr: 'هاتور', days: 30 },
  { month: 4, nameAr: 'كيهك', days: 30 },
  { month: 5, nameAr: 'طوبة', days: 30 },
  { month: 6, nameAr: 'أمشير', days: 30 },
  { month: 7, nameAr: 'برمهات', days: 30 },
  { month: 8, nameAr: 'برمودة', days: 30 },
  { month: 9, nameAr: 'بشنس', days: 30 },
  { month: 10, nameAr: 'بؤونة', days: 30 },
  { month: 11, nameAr: 'أبيب', days: 30 },
  { month: 12, nameAr: 'مسرى', days: 30 },
  { month: 13, nameAr: 'النسئ', days: 6 },
] as const;

export interface CopticDateInfo {
  copticMonth: number;
  copticDay: number;
  copticYear: number;
  monthNameAr: string;
  label: string;
}

export function cairoTodayIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value || '01')
    .join('-');
}

export function getCopticDateFromIso(isoDate?: string): CopticDateInfo {
  const safeIso = isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : cairoTodayIso();
  const dateObj = new Date(`${safeIso}T12:00:00Z`);

  const parts = new Intl.DateTimeFormat('en-u-ca-coptic', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(dateObj);

  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1743', 10);

  const copticMonth = Math.min(Math.max(month, 1), 13);
  const copticDay = Math.min(Math.max(day, 1), copticMonth === 13 ? 6 : 30);
  const monthNameAr = COPTIC_MONTHS[copticMonth - 1]?.nameAr || 'توت';

  return {
    copticMonth,
    copticDay,
    copticYear: year,
    monthNameAr,
    label: `${copticDay} ${monthNameAr} ${year} ش`,
  };
}
