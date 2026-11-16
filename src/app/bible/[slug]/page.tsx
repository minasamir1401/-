import { BibleChapterScreen, buildBibleChapterMetadata } from '@/components/BibleChapterScreen';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return buildBibleChapterMetadata(slug, 1);
}

export default async function BibleBookIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BibleChapterScreen slug={slug} chapter={1} />;
}
