import { OfflineReaderClient } from '@/components/OfflineReaderClient';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'وضع القراءة أوفلاين',
  description: 'اقرأ الكتاب المقدس وموسوعة الشبهات والشروحات والسنكسار والكتب المحفوظة بدون اتصال بالإنترنت.',
  path: '/offline-reader',
  noIndex: true,
});

export default function OfflineReaderPage() {
  return <OfflineReaderClient />;
}
