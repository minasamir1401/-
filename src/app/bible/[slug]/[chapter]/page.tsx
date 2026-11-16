import { notFound } from 'next/navigation';
import { BibleChapterScreen, buildBibleChapterMetadata } from '@/components/BibleChapterScreen';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  if (!/^\d+$/.test(chapter)) notFound();
  return buildBibleChapterMetadata(slug, Number(chapter));
}

export default async function BibleChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  if (!/^\d+$/.test(chapter)) notFound();
  return <BibleChapterScreen slug={slug} chapter={Number(chapter)} />;
}
