import { BibleChapterScreen } from '@/components/BibleChapterScreen';

export const dynamic = 'force-dynamic';

export default async function BibleBookIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BibleChapterScreen slug={slug} chapter={1} />;
}
