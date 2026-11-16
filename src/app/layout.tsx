import type { Metadata } from 'next';
import { Cairo, Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { AudioPlayerProvider } from '@/components/AudioPlayerContext';
import { FloatingAiWidget } from '@/components/FloatingAiWidget';
import { PwaProvider } from '@/components/PwaProvider';
import { SiteMotionCoordinator } from '@/components/SiteMotionCoordinator';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_SEO_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  resolveSiteUrl,
} from '@/lib/seo';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-reading',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: DEFAULT_SEO_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${notoSansArabic.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__deferredPwaPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__deferredPwaPrompt=e;});",
          }}
        />
        <PwaProvider>
          <AudioPlayerProvider>
            <SiteHeader />
            <a href="#main" className="sr-only focus:not-sr-only focus:p-3">انتقل إلى المحتوى</a>
            <main id="main" className="flex-1">
              <SiteMotionCoordinator>{children}</SiteMotionCoordinator>
            </main>
            <FloatingAiWidget />
            <SiteFooter />
          </AudioPlayerProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
