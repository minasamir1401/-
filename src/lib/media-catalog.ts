import archiveVideos from '@/data/orthodox-videos.json';
import jehovahLogicData from '@/data/jehovah-logic-channel.json';

const pope = 'https://popeshenouda.org.eg/';
const cdn = 'https://cdn.popeshenouda.org.eg/';

export const videoCategories = {
  teaching: 'شرح الإيمان',
  defense: 'الدفاع عن العقيدة',
  bible: 'تفسير الكتاب المقدس',
  songs: 'ترانيم',
  chants: 'تراتيل وألحان قبطية',
} as const;

export const channelFilters = {
  'jehovah-logic': 'منطق يهوه (Jehovah Logic)',
  archive: 'أرشيف الكنيسة والتفاسير',
} as const;

export const videoKinds = {
  video: 'فيديوهات كاملة',
  stream: 'بث مباشر',
  short: 'مقاطع قصيرة Shorts',
} as const;

export type VideoCategory = keyof typeof videoCategories;
export type ChannelKey = keyof typeof channelFilters;
export type VideoKind = keyof typeof videoKinds;

export type Video = {
  id: string;
  category: VideoCategory;
  title: string;
  description: string;
  credit: string;
  channel: ChannelKey;
  kind: VideoKind;
  series?: string;
  playlistIds?: string[];
  duration?: string;
  youtubeId?: string;
  fileUrl?: string;
  sourceUrl?: string;
};

export type YouTubePlaylist = {
  id: string;
  title: string;
  category: VideoCategory;
  videoCount: number;
  coverVideoId: string;
  videoIds: string[];
  youtubeUrl: string;
};

export const jehovahLogicChannel = jehovahLogicData.channel;

export const jehovahLogicPlaylists: YouTubePlaylist[] = jehovahLogicData.playlists.map((pl) => ({
  id: pl.id,
  title: pl.title,
  category: Object.hasOwn(videoCategories, pl.category) ? (pl.category as VideoCategory) : 'defense',
  videoCount: pl.videoCount,
  coverVideoId: pl.coverVideoId,
  videoIds: pl.videoIds,
  youtubeUrl: pl.youtubeUrl,
}));

const jehovahLogicPlaylistMap = new Map(jehovahLogicPlaylists.map((pl) => [pl.id, pl]));

const featuredVideos: Video[] = [
  {
    id: 'creed-creator', category: 'teaching', title: 'قانون الإيمان: الذي به كان كل شيء',
    description: 'شرح لعبارة من قانون الإيمان ومعناها في فهم علاقة الابن بالخليقة.',
    credit: 'البابا شنودة الثالث · الموقع الرسمي', channel: 'archive', kind: 'video', youtubeId: 'PnBO9cW_ZRM',
    fileUrl: cdn + 'videos/Dogmatic Theology/قانون الإيمان - الذي به كان كل شيء 26-01-1993.mp4',
    sourceUrl: pope + 'قانون-الإيمان-الذي-به-كان-كل-شيء-2/',
  },
  {
    id: 'one-lord', category: 'defense', title: 'قانون الإيمان: نؤمن برب واحد',
    description: 'مدخل إلى فهم وحدانية الله والاعتراف بربوبية المسيح في قانون الإيمان.',
    credit: 'البابا شنودة الثالث · الموقع الرسمي', channel: 'archive', kind: 'video',
    fileUrl: cdn + 'videos/Dogmatic Theology/قانون الإيمان - نؤمن برب واحد 25-09-1990.mp4',
    sourceUrl: pope + 'قانون-الإيمان-نؤمن-برب-واحد/',
  },
  {
    id: 'john-introduction', category: 'bible', title: 'مقدمة إنجيل يوحنا والأصحاح الأول',
    description: 'بداية دراسة إنجيل يوحنا في اجتماع بولس الرسول لدراسة الكتاب المقدس.',
    credit: 'أبونا داود لمعي · القناة الرسمية', channel: 'archive', kind: 'video', youtubeId: 'DJhIwatChEo', series: 'دراسة إنجيل يوحنا',
  },
  {
    id: 'god-remembers', category: 'songs', title: 'ترنيمة ربنا لا ينسانا',
    description: 'ترنيمة عن الرجاء والثقة في رعاية ربنا.',
    credit: 'قناة مي سات · YouTube', channel: 'archive', kind: 'video', youtubeId: 'DG8Hj7pG_-M',
  },
  {
    id: 'king-of-peace', category: 'chants', title: 'إبؤرو — يا ملك السلام',
    description: 'لحن قبطي لطلب السلام، مع كلمات معروضة تساعد على متابعة اللحن.',
    credit: 'COCC Visual Hymns · YouTube', channel: 'archive', kind: 'video', youtubeId: 'dLnsyxbUD7c',
  },
  {
    id: 'creed-reflections', category: 'teaching', title: 'تأملات في قانون الإيمان',
    description: 'تأملات في ما نعلنه عندما نصلّي قانون الإيمان.',
    credit: 'القمص داود لمعي · قناة جواهر الكلمة', channel: 'archive', kind: 'video', youtubeId: 'RqXemSQ-tnA',
  },
  {
    id: 'psalm-50', category: 'chants', title: 'المزمور الخمسون بالقبطي',
    description: 'ترتيل مزمور التوبة باللغة القبطية.',
    credit: 'قناة اللغة القبطية · YouTube', channel: 'archive', kind: 'video', youtubeId: 'F4rIBN7PFzI',
  },
  {
    id: 'cross-and-incarnation', category: 'defense', title: 'هل مات الله على الصليب؟',
    description: 'إجابة عن سؤال الموت على الصليب ومعنى اتحاد اللاهوت والناسوت في المسيح.',
    credit: 'البابا شنودة الثالث · الموقع الرسمي', channel: 'archive', kind: 'video',
    fileUrl: cdn + 'Audios/FQA/لاهوت عقيدي/سؤال نؤمن أن المسيح هو الله فهل الله يموت؟ وإن كان الناسوت هو الذي مات على الصليب فكيف يكون للمسيح إذًا طبيعة واحدة؟ 05-05-1992.mp4',
    sourceUrl: pope + 'سؤال-نؤمن-أن-المسيح-هو-الله-فهل-الله-يمو/',
  },
  {
    id: 'resurrection-and-ascension', category: 'defense', title: 'هل صعد المسيح بالجسد بعد القيامة؟',
    description: 'سؤال وجواب حول جسد المسيح بعد القيامة والصعود.',
    credit: 'البابا شنودة الثالث · الموقع الرسمي', channel: 'archive', kind: 'video',
    fileUrl: cdn + 'Audios/FQA/لاهوت عقيدي/سؤال ماذا كانت نهاية المسيح بعد القيامة وهل رفع إلى السماء حيًا بجسده أم بروحه؟ 12-05-1992.mp4',
    sourceUrl: pope + 'سؤال-ماذا-كانت-نهاية-المسيح-بعد-القيام/',
  },
  {
    id: 'john-testimony', category: 'bible', title: 'إنجيل يوحنا ١: ١٩–٤٠',
    description: 'متابعة الأصحاح الأول: شهادة يوحنا المعمدان وبداية دعوة التلاميذ.',
    credit: 'أبونا داود لمعي · القناة الرسمية', channel: 'archive', kind: 'video', youtubeId: 'Ug6HF2dfMNQ', series: 'دراسة إنجيل يوحنا',
  },
];

const jehovahLogicVideos: Video[] = jehovahLogicData.videos.flatMap((entry) => {
  if (!Object.hasOwn(videoCategories, entry.category)) return [];
  const kind: VideoKind = entry.kind === 'short' || entry.kind === 'stream' ? entry.kind : 'video';
  return [{
    id: entry.id,
    category: entry.category as VideoCategory,
    title: entry.title,
    description: entry.description,
    credit: entry.credit,
    channel: 'jehovah-logic' as const,
    kind,
    series: entry.series,
    playlistIds: Array.isArray(entry.playlistIds) ? entry.playlistIds : undefined,
    youtubeId: entry.youtubeId,
  }];
});

const legacyArchiveVideos: Video[] = archiveVideos.flatMap((entry) => {
  if (!Object.hasOwn(videoCategories, entry.category)) return [];
  return [{ ...entry, category: entry.category as VideoCategory, description: '', channel: 'archive' as const, kind: 'video' as const }];
});

export const videos: Video[] = [
  ...jehovahLogicVideos,
  ...featuredVideos,
  ...legacyArchiveVideos,
];

const videoById = new Map(videos.map((v) => [v.id, v]));

export function getPlaylistById(playlistId: string): YouTubePlaylist | undefined {
  return jehovahLogicPlaylistMap.get(playlistId);
}

export function getPlaylistVideos(playlistId: string): Video[] {
  const pl = getPlaylistById(playlistId);
  if (!pl) return [];
  return pl.videoIds.map((id) => videoById.get(id)).filter((v): v is Video => Boolean(v));
}

export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbnailUrl(id: string, quality: 'mq' | 'hq' = 'hq') {
  return `https://i.ytimg.com/vi/${id}/${quality}default.jpg`;
}

export function encodeMediaFileUrl(fileUrl: string) {
  // File names published by the archive may include literal question marks.
  const { origin } = new URL(fileUrl);
  return origin + fileUrl.slice(origin.length).split('/').map(encodeURIComponent).join('/');
}

export { default as apologeticsCollections } from '../data/apologetics-books.json';

export function normalizeMediaQuery(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
}

export function matchesMediaQuery(text: string, query: string) {
  const normalizedText = normalizeMediaQuery(text);
  return normalizeMediaQuery(query).split(' ').every((word) => normalizedText.includes(word));
}
