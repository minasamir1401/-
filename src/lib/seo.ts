import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const SITE_NAME = 'المنارة الأرثوذكسية';
export const SITE_ALT_NAME = 'The Orthodox Beacon';
export const SITE_TAGLINE = 'الكتاب المقدس والتفاسير والمكتبة والرد على الشبهات والعظات';
export const SITE_DESCRIPTION =
  'منصة قبطية أرثوذكسية عربية شاملة لقراءة الكتاب المقدس بالأسفار القانونية الثانية، والتفاسير الآبائية، وموسوعة الرد على الشبهات، والمكتبة الرقمية، والعظات الصوتية، والقطمارس والسنكسار اليومي.';
export const DEFAULT_OG_IMAGE = '/design/sanctuary.webp';

export const DEFAULT_SEO_KEYWORDS = [
  'المنارة الأرثوذكسية',
  'الكنيسة القبطية الأرثوذكسية',
  'الكتاب المقدس',
  'تفسير الكتاب المقدس',
  'تفاسير آبائية',
  'الرد على الشبهات',
  'اللاهوت الدفاعي الأرثوذكسي',
  'العقيدة الأرثوذكسية',
  'المكتبة القبطية',
  'كتب البابا شنودة الثالث',
  'الأجبية والقطمارس',
  'السنكسار القبطي',
  'عظات مسيحية',
];

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured?.trim()) return normalizeOrigin(configured);
  return 'http://localhost:3000';
}

export async function resolveRuntimeOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured?.trim()) return normalizeOrigin(configured);

  const reqHeaders = await headers();
  const rawHost = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host');
  const host = rawHost?.split(',')[0]?.trim();
  if (!host) return 'http://localhost:3000';

  const forwardedProto = reqHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = forwardedProto || (isLocal ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin.replace(/\/+$/, '')}${cleanPath}`;
}

export function stripHtmlToText(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateSeoText(text: string, maxLength = 160): string {
  const cleaned = stripHtmlToText(text);
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article' | 'book' | 'profile';
  keywords?: string[];
  image?: string | null;
  noIndex?: boolean;
  authors?: string[];
}

export function buildPageMetadata(options: PageSeoOptions): Metadata {
  const description = truncateSeoText(options.description || SITE_DESCRIPTION, 160);
  const image = options.image?.trim() || DEFAULT_OG_IMAGE;
  const fullTitle = options.absoluteTitle ? options.title : `${options.title} | ${SITE_NAME}`;
  const keywords = options.keywords?.length
    ? Array.from(new Set([...options.keywords, SITE_NAME]))
    : undefined;

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: options.path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: options.path,
      siteName: SITE_NAME,
      locale: 'ar_EG',
      type: options.type || 'website',
      ...(options.authors?.length ? { authors: options.authors } : {}),
      images: [
        {
          url: image,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : {
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
}

function publisherOrg(origin: string) {
  return {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAME,
    url: origin,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(origin, '/icon.png'),
    },
  };
}

export function buildWebsiteJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...publisherOrg(origin),
        description: SITE_DESCRIPTION,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'ar',
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(
  origin: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(origin, item.path),
    })),
  };
}

export function buildArticleJsonLd(
  origin: string,
  input: {
    headline: string;
    description: string;
    path: string;
    section: string;
    authorName?: string | null;
    keywords?: string[];
  },
) {
  const url = absoluteUrl(origin, input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: input.headline,
    description: truncateSeoText(input.description, 200),
    articleSection: input.section,
    inLanguage: 'ar',
    image: absoluteUrl(origin, DEFAULT_OG_IMAGE),
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : publisherOrg(origin),
    publisher: publisherOrg(origin),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
  };
}

export function buildBookJsonLd(
  origin: string,
  input: {
    name: string;
    description: string;
    path: string;
    authorName: string;
    authorPath: string;
    categoryName: string;
    coverUrl?: string | null;
    pageCount?: number | null;
  },
) {
  const url = absoluteUrl(origin, input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${url}#book`,
    url,
    name: input.name,
    description: truncateSeoText(input.description, 240),
    inLanguage: 'ar',
    bookFormat: 'https://schema.org/EBook',
    genre: input.categoryName,
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: absoluteUrl(origin, input.authorPath),
    },
    publisher: publisherOrg(origin),
    ...(input.coverUrl ? { image: input.coverUrl } : { image: absoluteUrl(origin, DEFAULT_OG_IMAGE) }),
    ...(input.pageCount ? { numberOfPages: input.pageCount } : {}),
  };
}

export function buildProfileJsonLd(
  origin: string,
  input: {
    name: string;
    description: string;
    path: string;
    jobTitle?: string;
  },
) {
  const url = absoluteUrl(origin, input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    inLanguage: 'ar',
    mainEntity: {
      '@type': 'Person',
      name: input.name,
      description: truncateSeoText(input.description, 220),
      url,
      ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    },
  };
}
