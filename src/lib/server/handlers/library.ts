import { BookFormat, BookStatus, Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '../prisma';
import { normalizeArabic, safeDecodeSlug } from '../arabic';
import { FEATURED_DEFENSE_GROUPS } from '../constants';
import { readableChapter } from '../text-formatters';
import { RouteError } from '../route-error';

function serializeBook<T extends { fileSizeBytes: bigint | null }>(b: T) {
  return {
    ...b,
    fileSizeBytes: b.fileSizeBytes !== null ? Number(b.fileSizeBytes) : null,
  };
}

const BOOK_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  coverUrl: true,
  format: true,
  pageCount: true,
  fileSizeBytes: true,
  sourceSite: true,
  author: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const;

export const getDefenseFeaturedBooks = unstable_cache(
  async () => {
    const allSlugs = FEATURED_DEFENSE_GROUPS.flatMap((g) => g.slugs);
    const books = await prisma.book.findMany({
      where: {
        slug: { in: allSlugs },
        status: BookStatus.PUBLISHED,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        format: true,
        pageCount: true,
        author: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { chapters: true } },
      },
    });

    const bySlug = new Map(books.map((book) => [book.slug, book]));
    const groups = FEATURED_DEFENSE_GROUPS.map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      books: group.slugs
        .map((slug) => bySlug.get(slug))
        .filter((book): book is NonNullable<typeof book> => Boolean(book)),
    }));

    return {
      totalBooks: groups.reduce((acc, g) => acc + g.books.length, 0),
      groups,
    };
  },
  ['orthodox-defense-featured-books'],
  { revalidate: 3600 },
);

export const getLibraryMeta = unstable_cache(
  async () => {
    const [categories, authors, totalBooks] = await Promise.all([
      prisma.bookCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { books: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.author.findMany({
        where: { books: { some: { status: BookStatus.PUBLISHED } } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { books: true } },
        },
        orderBy: { books: { _count: 'desc' } },
        take: 80,
      }),
      prisma.book.count({ where: { status: BookStatus.PUBLISHED } }),
    ]);
    return { categories, authors, totalBooks };
  },
  ['orthodox-library-meta'],
  { revalidate: 600 },
);

export async function getAuthorProfile(rawSlug: string) {
  const author = await prisma.author.findUnique({
    where: { slug: safeDecodeSlug(rawSlug) },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      books: {
        where: { status: BookStatus.PUBLISHED },
        select: BOOK_CARD_SELECT,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!author) throw new RouteError(404, 'المؤلف غير موجود');

  return {
    author: {
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio,
    },
    books: author.books.map(serializeBook),
  };
}

export async function listBooks(params: {
  q?: string;
  category?: string;
  author?: string;
  format?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
}) {
  const {
    q = '',
    category,
    author,
    format,
    sort = 'latest',
    page = '1',
    pageSize = '18',
  } = params;

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const take = Math.min(Math.max(parseInt(pageSize, 10) || 18, 1), 60);
  const skip = (currentPage - 1) * take;
  const normalized = normalizeArabic(q);

  const where: Prisma.BookWhereInput = {
    status: BookStatus.PUBLISHED,
    ...(normalized ? { textNormalized: { contains: normalized } } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(author ? { author: { slug: author } } : {}),
    ...(format && ['PDF', 'HTML_CHAPTERS', 'BOTH'].includes(format)
      ? { format: { in: format === 'BOTH' ? ['BOTH'] : [format as BookFormat, 'BOTH'] } }
      : {}),
  };

  const orderBy: Prisma.BookOrderByWithRelationInput =
    sort === 'popular' ? { downloadsCount: 'desc' } : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: BOOK_CARD_SELECT,
      orderBy,
      skip,
      take,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    items: items.map(serializeBook),
    total,
    page: currentPage,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

export async function getBookDetail(rawSlug: string) {
  const decodedSlug = safeDecodeSlug(rawSlug);

  const book = await prisma.book.findUnique({
    where: { slug: decodedSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      format: true,
      pageCount: true,
      fileSizeBytes: true,
      sourceSite: true,
      sourcePageUrl: true,
      downloadsCount: true,
      viewsCount: true,
      author: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      chapters: {
        select: { id: true, chapterNumber: true, title: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) {
    throw new RouteError(404, 'الكتاب غير موجود');
  }

  void prisma.book
    .update({ where: { id: book.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});

  return { book: serializeBook(book) };
}

export async function getBookChapter(rawSlug: string, rawChapterNumber: string) {
  const chNum = parseInt(rawChapterNumber, 10);
  if (Number.isNaN(chNum) || chNum < 1) {
    throw new RouteError(400, 'رقم الفصل غير صالح');
  }

  const book = await prisma.book.findUnique({
    where: { slug: safeDecodeSlug(rawSlug) },
    select: {
      id: true,
      slug: true,
      title: true,
      format: true,
      fileSizeBytes: true,
      author: { select: { id: true, name: true, slug: true } },
      chapters: {
        select: { chapterNumber: true, title: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) throw new RouteError(404, 'الكتاب غير موجود');

  const chapter = await prisma.bookChapter.findUnique({
    where: { bookId_chapterNumber: { bookId: book.id, chapterNumber: chNum } },
    select: {
      id: true,
      bookId: true,
      chapterNumber: true,
      title: true,
      contentHtml: true,
    },
  });

  if (!chapter) throw new RouteError(404, 'الفصل غير موجود');

  return {
    book: serializeBook(book),
    chapter: { ...chapter, contentHtml: readableChapter(chapter.contentHtml) },
  };
}
