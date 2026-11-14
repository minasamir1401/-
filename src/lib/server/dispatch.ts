import { RouteError } from './route-error';
import { getAgpeyaHour, getDailyLiturgy, getLiturgicalBooks } from './liturgy-service';
import { listMaskedKeys } from './orthodox-ai/gemini-pool';
import {
  getApologeticsByBible,
  getApologeticsDetail,
  listApologetics,
} from './handlers/apologetics';
import {
  getBibleBooks,
  getBibleChapter,
  getCommentaries,
  getCommentaryBooks,
  searchBible,
} from './handlers/bible';
import {
  getExplanationCategories,
  getExplanationDetail,
  listExplanations,
} from './handlers/explanations';
import {
  getAuthorProfile,
  getBookChapter,
  getBookDetail,
  getDefenseFeaturedBooks,
  getLibraryMeta,
  listBooks,
} from './handlers/library';
import { getQuestionsStats } from './handlers/questions';
import {
  getPreacherProfile,
  getPreachersAndTopics,
  listSermons,
} from './handlers/sermons';
import { getHealthStatus, getPortalStats, searchPortal } from './handlers/stats';
import { getSynaxariumToday, listSynaxarium } from './handlers/synaxarium';

export async function dispatchServerGet(pathWithQuery: string): Promise<unknown> {
  const url = new URL(pathWithQuery, 'http://localhost');
  const sp = url.searchParams;
  const opt = (key: string) => {
    const val = sp.get(key);
    return val !== null ? val : undefined;
  };
  const path = url.pathname;

  if (path === '/api/health') return getHealthStatus();
  if (path === '/api/stats') return getPortalStats();
  if (path === '/api/search') return searchPortal(sp.get('q') || '');

  if (path === '/api/bible/books') return getBibleBooks(opt('testament'));
  if (path === '/api/bible/search') {
    return searchBible({ q: opt('q'), testament: opt('testament'), limit: opt('limit') });
  }
  const bibleChapterMatch = path.match(/^\/api\/bible\/books\/([^/]+)\/chapters\/([^/]+)$/);
  if (bibleChapterMatch) {
    return getBibleChapter(bibleChapterMatch[1], bibleChapterMatch[2]);
  }

  if (path === '/api/commentaries') {
    return getCommentaries({
      bookSlug: opt('bookSlug'),
      authorSlug: opt('authorSlug'),
      page: opt('page'),
      pageSize: opt('pageSize'),
    });
  }
  if (path === '/api/commentaries/books') return getCommentaryBooks();

  if (path === '/api/apologetics') {
    return listApologetics({
      domain: opt('domain'),
      q: opt('q'),
      page: opt('page'),
      pageSize: opt('pageSize'),
    });
  }
  const apolBibleMatch = path.match(/^\/api\/apologetics\/by-bible\/([^/]+)\/([^/]+)$/);
  if (apolBibleMatch) {
    return getApologeticsByBible(apolBibleMatch[1], apolBibleMatch[2]);
  }
  const apolDetailMatch = path.match(/^\/api\/apologetics\/([^/]+)$/);
  if (apolDetailMatch) {
    return getApologeticsDetail(apolDetailMatch[1]);
  }

  if (path === '/api/explanations') {
    return listExplanations({
      q: opt('q'),
      category: opt('category'),
      type: opt('type'),
      page: opt('page'),
      pageSize: opt('pageSize'),
    });
  }
  if (path === '/api/explanations/categories') return getExplanationCategories();
  const explanationMatch = path.match(/^\/api\/explanations\/([^/]+)$/);
  if (explanationMatch) {
    return getExplanationDetail(explanationMatch[1]);
  }

  if (path === '/api/books') {
    return listBooks({
      q: opt('q'),
      category: opt('category'),
      author: opt('author'),
      format: opt('format'),
      sort: opt('sort'),
      page: opt('page'),
      pageSize: opt('pageSize'),
    });
  }
  if (path === '/api/books/meta') return getLibraryMeta();
  if (path === '/api/books/defense-featured') return getDefenseFeaturedBooks();
  const bookChapterMatch = path.match(/^\/api\/books\/([^/]+)\/chapters\/([^/]+)$/);
  if (bookChapterMatch) {
    return getBookChapter(bookChapterMatch[1], bookChapterMatch[2]);
  }
  const bookMatch = path.match(/^\/api\/books\/([^/]+)$/);
  if (bookMatch) {
    return getBookDetail(bookMatch[1]);
  }

  const authorMatch = path.match(/^\/api\/authors\/([^/]+)$/);
  if (authorMatch) {
    return getAuthorProfile(authorMatch[1]);
  }

  if (path === '/api/sermons') {
    return listSermons({
      q: opt('q'),
      preacher: opt('preacher'),
      topic: opt('topic'),
      page: opt('page'),
      pageSize: opt('pageSize'),
    });
  }
  if (path === '/api/sermons/preachers') return getPreachersAndTopics();
  const preacherMatch = path.match(/^\/api\/preachers\/([^/]+)$/);
  if (preacherMatch) {
    return getPreacherProfile(preacherMatch[1]);
  }

  if (path === '/api/liturgy/today') return getDailyLiturgy(opt('date'));
  if (path === '/api/liturgy/books') {
    const books = await getLiturgicalBooks();
    return { books };
  }
  const agpeyaMatch = path.match(/^\/api\/liturgy\/agpeya\/([^/]+)$/);
  if (agpeyaMatch) {
    return getAgpeyaHour(agpeyaMatch[1]);
  }

  if (path === '/api/synaxarium') {
    return listSynaxarium({ month: opt('month'), day: opt('day'), q: opt('q') });
  }
  if (path === '/api/synaxarium/today') return getSynaxariumToday(opt('date'));

  if (path === '/api/questions/stats') return getQuestionsStats();
  if (path === '/api/ai/keys') return listMaskedKeys();

  throw new RouteError(404, `Unknown internal API path: ${path}`);
}
