import { BookStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { normalizeArabic } from '../arabic';

export interface OrthodoxCitation {
  type: 'apologetics' | 'bible' | 'book' | 'article';
  title: string;
  subtitle: string;
  url: string;
}

const ARABIC_STOPWORDS = new Set([
  'في', 'من', 'الي', 'علي', 'عن', 'هل', 'ما', 'ماذا', 'لماذا', 'كيف', 'متي', 'اين',
  'انا', 'انت', 'هو', 'هي', 'نحن', 'هم', 'ان', 'انني', 'اني', 'انو', 'انه', 'لا', 'نعم', 'يا',
  'دي', 'ده', 'دا', 'ايه', 'ازاي', 'ليه', 'مش', 'عايز', 'قولي', 'قلي', 'كل', 'اي',
  'او', 'و', 'ثم', 'مع', 'بين', 'التي', 'الذي', 'هذا', 'هذه', 'ذلك', 'تلك',
  'كان', 'يكون', 'تكون', 'قد', 'لقد', 'حتي', 'فقط', 'بعد', 'قبل', 'غير',
  'واحد', 'بيقول', 'بتقول', 'يقول', 'تقول', 'قال', 'اللي', 'حد', 'حاجه', 'شي', 'شئ',
  'ممكن', 'عشان', 'علشان', 'لو', 'سمحت', 'يعني', 'بس', 'كده',
]);

export function stripHtmlPlain(html: string, maxLen = 420): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function extractKeywords(query: string): string[] {
  const normalized = normalizeArabic(query);
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const meaningful = rawTokens.filter((w) => w.length >= 3 && !ARABIC_STOPWORDS.has(w));
  return Array.from(new Set(meaningful)).slice(0, 6);
}

export async function buildOrthodoxContext(query: string): Promise<{
  promptContext: string;
  citations: OrthodoxCitation[];
}> {
  const keywords = extractKeywords(query);
  if (!keywords.length) {
    return { promptContext: '', citations: [] };
  }

  const specificKeywords = keywords.filter((kw) => kw !== 'المسيح' && kw !== 'الله' && kw !== 'الرب');
  const searchTerms = specificKeywords.length > 0 ? specificKeywords : keywords;
  const orTerms = searchTerms.map((kw) => ({ normalizedIndex: { contains: kw } }));
  const orTextTerms = searchTerms.map((kw) => ({ textNormalized: { contains: kw } }));

  const [apologeticsRaw, verses, books, articles] = await Promise.all([
    prisma.apologeticsEntry.findMany({
      where: { OR: orTerms },
      take: 15,
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      select: {
        slug: true,
        domainAr: true,
        question: true,
        shortSummary: true,
        answerHtml: true,
        normalizedIndex: true,
      },
    }),
    prisma.bibleVerse.findMany({
      where: { AND: searchTerms.slice(0, 2).map((kw) => ({ textNormalized: { contains: kw } })) },
      take: 3,
      select: {
        chapter: true,
        verseNumber: true,
        textTashkeel: true,
        book: { select: { slug: true, nameAr: true } },
      },
    }),
    prisma.book.findMany({
      where: { status: BookStatus.PUBLISHED, OR: orTextTerms },
      take: 2,
      select: {
        slug: true,
        title: true,
        author: { select: { name: true } },
      },
    }),
    prisma.explanationArticle.findMany({
      where: { OR: orTextTerms },
      take: 2,
      select: { slug: true, title: true, summary: true, sourceName: true },
    }),
  ]);

  const apologetics = apologeticsRaw
    .map((entry) => {
      const qNorm = normalizeArabic(entry.question);
      const score = searchTerms.reduce((acc, kw) => {
        if (qNorm.includes(kw)) return acc + 3;
        if (entry.normalizedIndex.includes(kw)) return acc + 1;
        return acc;
      }, 0);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.entry);

  const contextLines: string[] = [];
  const citations: OrthodoxCitation[] = [];

  for (const a of apologetics) {
    contextLines.push(
      `- [رد دفاعي موثق - ${a.domainAr}] السؤال: ${a.question}\n  الخلاصة: ${a.shortSummary}\n  مقتطف: ${stripHtmlPlain(a.answerHtml, 380)}`,
    );
    citations.push({
      type: 'apologetics',
      title: a.question,
      subtitle: `موسوعة الشبهات - ${a.domainAr}`,
      url: `/apologetics/${a.slug}`,
    });
  }

  for (const v of verses) {
    const refLabel = `${v.book.nameAr} ${v.chapter}: ${v.verseNumber}`;
    contextLines.push(`- [نص كتابي] (${refLabel}): «${v.textTashkeel}»`);
    citations.push({
      type: 'bible',
      title: refLabel,
      subtitle: v.textTashkeel.slice(0, 90) + (v.textTashkeel.length > 90 ? '...' : ''),
      url: `/bible/${v.book.slug}/${v.chapter}#v${v.verseNumber}`,
    });
  }

  for (const b of books) {
    contextLines.push(`- [كتاب بالمكتبة] «${b.title}» - ${b.author.name}`);
    citations.push({
      type: 'book',
      title: b.title,
      subtitle: b.author.name,
      url: `/library/${encodeURIComponent(b.slug)}`,
    });
  }

  for (const art of articles) {
    contextLines.push(`- [مقال تعليمي] «${art.title}»: ${art.summary}`);
    citations.push({
      type: 'article',
      title: art.title,
      subtitle: art.sourceName,
      url: `/explanations/${encodeURIComponent(art.slug)}`,
    });
  }

  const promptContext = contextLines.length
    ? `\n\n[مراجع موثقة من قاعدة بيانات المنارة الأرثوذكسية مرتبطة بالسؤال — استشهد بها متى أفادت الإجابة]:\n${contextLines.join('\n')}`
    : '';

  return { promptContext, citations };
}

function extractCommentarySnippetForVerse(html: string, verseNumber: number, maxLen = 850): string {
  const plain = stripHtmlPlain(html, 20_000);
  if (!plain) return '';

  const patterns = [
    new RegExp(`(?:آية|ع|عدد)\\s*${verseNumber}(?!\\d)`),
    new RegExp(`[\\[(«]\\s*${verseNumber}\\s*[\\])»]`),
    new RegExp(`\\s${verseNumber}\\s*[:-]`),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(plain);
    if (match) {
      const start = Math.max(0, match.index - 100);
      return plain.slice(start, start + maxLen).trim();
    }
  }

  return plain.slice(0, maxLen).trim();
}

export async function buildVerseExplanationContext(
  bookSlug: string,
  chapter: number,
  verseNumber: number,
): Promise<{
  verseRef: string;
  verseText: string;
  promptContext: string;
  citations: OrthodoxCitation[];
} | null> {
  const book = await prisma.bibleBook.findUnique({
    where: { slug: bookSlug },
    select: { id: true, slug: true, nameAr: true, chaptersCount: true },
  });
  if (!book || chapter < 1 || chapter > book.chaptersCount) return null;

  const minVerse = Math.max(1, verseNumber - 2);
  const maxVerse = verseNumber + 2;

  const [surroundingVerses, commentaries, apologeticsRefs] = await Promise.all([
    prisma.bibleVerse.findMany({
      where: {
        bookId: book.id,
        chapter,
        verseNumber: { gte: minVerse, lte: maxVerse },
      },
      orderBy: { verseNumber: 'asc' },
      select: { verseNumber: true, textTashkeel: true },
    }),
    prisma.bibleCommentary.findMany({
      where: { bookId: book.id, chapter },
      take: 2,
      orderBy: { id: 'asc' },
      select: {
        title: true,
        contentHtml: true,
        author: { select: { name: true } },
      },
    }),
    prisma.apologeticsBibleRef.findMany({
      where: { bookId: book.id, chapter },
      take: 3,
      orderBy: { entry: { orderIndex: 'asc' } },
      select: {
        entry: {
          select: { slug: true, domainAr: true, question: true, shortSummary: true },
        },
      },
    }),
  ]);

  const targetVerse = surroundingVerses.find((v) => v.verseNumber === verseNumber);
  if (!targetVerse) return null;

  const verseRef = `${book.nameAr} ${chapter}: ${verseNumber}`;
  const contextLines: string[] = [];
  const citations: OrthodoxCitation[] = [];

  if (surroundingVerses.length > 1) {
    const contextText = surroundingVerses
      .map((v) => `(${v.verseNumber}) ${v.textTashkeel}`)
      .join('\n');
    contextLines.push(`[سياق الآيات المحيطة في ${book.nameAr} أصحاح ${chapter}]:\n${contextText}`);
  }

  for (const c of commentaries) {
    const excerpt = extractCommentarySnippetForVerse(c.contentHtml, verseNumber);
    if (!excerpt) continue;
    contextLines.push(`[من تفسير ${c.author.name} - ${c.title}]:\n${excerpt}`);
    citations.push({
      type: 'bible',
      title: `${c.title} (${c.author.name})`,
      subtitle: 'تفسير آبائي وكنسي للأصحاح',
      url: `/bible/${encodeURIComponent(book.slug)}/${chapter}#commentary`,
    });
  }

  const seenApologetics = new Set<string>();
  for (const ref of apologeticsRefs) {
    if (seenApologetics.has(ref.entry.slug)) continue;
    seenApologetics.add(ref.entry.slug);
    contextLines.push(
      `[شبهة ورد دفاعي مرتبط بالأصحاح - ${ref.entry.domainAr}]: ${ref.entry.question} — ${ref.entry.shortSummary}`,
    );
    citations.push({
      type: 'apologetics',
      title: ref.entry.question,
      subtitle: ref.entry.domainAr,
      url: `/apologetics/${encodeURIComponent(ref.entry.slug)}`,
    });
  }

  const promptContext = contextLines.length
    ? `\n\n[مراجع وسياق موثق من المنارة الأرثوذكسية]:\n${contextLines.join('\n\n')}`
    : '';

  return {
    verseRef,
    verseText: targetVerse.textTashkeel,
    promptContext,
    citations,
  };
}
