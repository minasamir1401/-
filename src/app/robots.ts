import type { MetadataRoute } from 'next';
import { resolveRuntimeOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await resolveRuntimeOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/library/*/file/', '/videos/download/', '/offline-reader'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
