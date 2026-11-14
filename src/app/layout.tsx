import type { Metadata } from 'next';
import { Amiri, Cairo } from 'next/font/google';
import './globals.css';
import { AudioPlayerProvider } from '@/components/AudioPlayerContext';
import { FloatingAiWidget } from '@/components/FloatingAiWidget';
import { SiteMotionCoordinator } from '@/components/SiteMotionCoordinator';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'المنارة الأرثوذكسية | الكتاب المقدس والمكتبة والتفاسير والعظات',
  description:
    'منصة قبطية أرثوذكسية لقراءة الكتاب المقدس والتفاسير والكتب العربية، ومشاهدة الفيديوهات، والاستماع للعظات، ومتابعة القطمارس.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AudioPlayerProvider>
          <SiteHeader />
          <a href="#main" className="sr-only focus:not-sr-only focus:p-3">انتقل إلى المحتوى</a>
          <main id="main" className="flex-1">
            <SiteMotionCoordinator>{children}</SiteMotionCoordinator>
          </main>
          <FloatingAiWidget />
          <SiteFooter />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
