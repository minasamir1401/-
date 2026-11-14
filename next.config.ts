import type { NextConfig } from 'next';

const useStandalone = process.env.NEXT_STANDALONE === 'true';

const nextConfig: NextConfig = {
  ...(useStandalone ? { output: 'standalone' as const } : {}),
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: '*.archive.org' },
      { protocol: 'https', hostname: 'eadn-wc05-6472364.nxedge.io' },
      { protocol: 'https', hostname: 'coptic-treasures.com' },
      { protocol: 'https', hostname: 'popeshenouda.org.eg' },
      { protocol: 'https', hostname: 'st-takla.org' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default nextConfig;
