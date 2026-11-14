export function sectionHref(path: string, filters: Record<string, string>) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  return query.size ? `${path}?${query.toString()}` : path;
}

export function queryString(value: string | string[] | undefined, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 160) : fallback;
}

export class ApiError extends Error {
  constructor(public readonly status: number, path: string) {
    super(`API ${status} on ${path}`);
  }
}

export function getPublicApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return 'غير محدد';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} ميجابايت`;
  return `${Math.round(bytes / 1024)} كيلوبايت`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export interface ApologeticsBibleRefDto {
  id?: number;
  chapter: number;
  verseLabel: string | null;
  book: { id?: number; slug: string; nameAr: string };
}

export interface ApologeticsSummaryDto {
  slug: string;
  domain: string;
  domainAr: string;
  question: string;
  shortSummary: string;
  verseLabel?: string | null;
}

export interface ApologeticsEntryDto {
  id: number;
  slug: string;
  domain: string;
  domainAr: string;
  question: string;
  shortSummary: string;
  answerHtml: string;
  relatedBookSlugs?: string[];
  relatedArticleSlugs?: string[];
  sourcesJson?: Array<{ title: string; url: string }>;
  bibleRefs?: ApologeticsBibleRefDto[];
}

export interface SynaxariumEntryDto {
  id: number;
  slug: string;
  copticMonth: number;
  copticDay: number;
  monthNameAr: string;
  entryOrder: number;
  saintTitle: string;
  summary: string | null;
  contentHtml: string;
  sourceUrl: string;
}

export interface CopticDateInfoDto {
  copticMonth: number;
  copticDay: number;
  copticYear: number;
  monthNameAr: string;
  label: string;
}

export async function postClientApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getPublicApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string })?.error || `خطأ في الخادم (${res.status})`);
  }
  return json as T;
}

export interface OrthodoxAiCitationDto {
  type: 'apologetics' | 'bible' | 'book' | 'article';
  title: string;
  subtitle: string;
  url: string;
}

export interface BibleVerseAiResponseDto {
  verseRef: string;
  verseText: string;
  reply: string;
  model: string;
  citations: OrthodoxAiCitationDto[];
}
