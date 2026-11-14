import { notFound } from 'next/navigation';
import { BibleChapterScreen } from '@/components/BibleChapterScreen';

export const dynamic = 'force-dynamic';

export default async function BibleChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  if (!/^\d+$/.test(chapter)) notFound();
  return <BibleChapterScreen slug={slug} chapter={Number(chapter)} />;
}
