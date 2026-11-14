import Link from 'next/link';
import { sectionHref } from '@/lib/api-client';

export function Pagination({ path, filters, page, totalPages, hash }: {
  path: string; filters: Record<string, string>; page: number; totalPages: number; hash?: string;
}) {
  if (totalPages < 2) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages].filter((n) => n >= 1 && n <= totalPages))]
    .sort((a, b) => a - b);
  const href = (n: number) => sectionHref(path, { ...filters, page: n === 1 ? '' : String(n) }) + (hash ? '#' + hash : '');
  return (
    <nav aria-label="صفحات النتائج" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link className="media-action" href={href(page - 1)}>السابق</Link>}
      {pages.map((n, i) => (
        <span className="flex items-center gap-2" key={n}>
          {i > 0 && n - pages[i - 1] > 1 && <span aria-hidden>…</span>}
          <Link className={`media-action ${n === page ? 'media-action-active' : ''}`} href={href(n)}
            aria-current={n === page ? 'page' : undefined} aria-label={`صفحة ${n}`}>{n}</Link>
        </span>
      ))}
      {page < totalPages && <Link className="media-action" href={href(page + 1)}>التالي</Link>}
    </nav>
  );
}
