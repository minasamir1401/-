import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, ExternalLink, ListVideo, Play, Search } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { SectionArtwork } from '@/components/SectionArtwork';
import { SectionIcon } from '@/components/SectionIcon';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  apologeticsCollections,
  channelFilters,
  getPlaylistById,
  getPlaylistVideos,
  jehovahLogicChannel,
  jehovahLogicPlaylists,
  matchesMediaQuery,
  videoCategories,
  videoKinds,
  videos,
  youtubeThumbnailUrl,
  type ChannelKey,
  type Video,
  type VideoCategory,
  type VideoKind,
} from '@/lib/media-catalog';

export const metadata: Metadata = {
  title: 'فيديوهات وشرح وقوائم تشغيل منطق يهوه | المنارة الأرثوذكسية',
  description:
    'مكتبة مرئية تضم جميع فيديوهات وقوائم تشغيل قناة منطق يهوه (Jehovah Logic)، إلى جانب شروح الإيمان والكتاب المقدس والرد على الشبهات والترانيم والألحان القبطية.',
};

type SearchParamValue = string | string[] | undefined;

type FilterState = {
  q: string;
  channel: string;
  kind: string;
  category: string;
  playlist: string;
  series: string;
};

function readParam(value: SearchParamValue, maxLength = 120): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function buildVideosHref(filters: FilterState, overrides: Partial<FilterState & { video?: string; page?: string }>, hash = 'watch'): string {
  const merged = { ...filters, ...overrides };
  const query = new URLSearchParams();
  if (merged.q) query.set('q', merged.q);
  if (merged.channel) query.set('channel', merged.channel);
  if (merged.kind) query.set('kind', merged.kind);
  if (merged.category) query.set('category', merged.category);
  if (merged.playlist) query.set('playlist', merged.playlist);
  if (merged.series) query.set('series', merged.series);
  if (merged.video) query.set('video', merged.video);
  if (merged.page && merged.page !== '1') query.set('page', merged.page);
  return `/videos${query.size ? '?' + query.toString() : ''}#${hash}`;
}

function kindLabel(kind: VideoKind): string {
  if (kind === 'short') return 'Shorts';
  if (kind === 'stream') return 'بث مباشر';
  return 'فيديو';
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: SearchParamValue;
    channel?: SearchParamValue;
    kind?: SearchParamValue;
    category?: SearchParamValue;
    playlist?: SearchParamValue;
    series?: SearchParamValue;
    video?: SearchParamValue;
    page?: SearchParamValue;
  }>;
}) {
  const params = await searchParams;
  const q = readParam(params.q);
  const channel = typeof params.channel === 'string' && Object.hasOwn(channelFilters, params.channel) ? (params.channel as ChannelKey) : '';
  const kind = typeof params.kind === 'string' && Object.hasOwn(videoKinds, params.kind) ? (params.kind as VideoKind) : '';
  const category = typeof params.category === 'string' && Object.hasOwn(videoCategories, params.category) ? (params.category as VideoCategory) : '';
  const rawPlaylist = readParam(params.playlist, 80);
  const activePlaylist = rawPlaylist ? getPlaylistById(rawPlaylist) : undefined;
  const playlist = activePlaylist ? activePlaylist.id : '';

  const basePool: Video[] = activePlaylist ? getPlaylistVideos(activePlaylist.id) : videos;

  const matchingFilters = basePool.filter((v) => {
    if (channel && v.channel !== channel) return false;
    if (kind && v.kind !== kind) return false;
    if (category && v.category !== category) return false;
    const playlistNames = (v.playlistIds || []).map((pid) => getPlaylistById(pid)?.title || '').join(' ');
    const searchable = `${v.title} ${v.description} ${v.credit} ${v.series || ''} ${playlistNames} ${videoCategories[v.category]}`;
    return matchesMediaQuery(searchable, q);
  });

  const seriesOptions = activePlaylist
    ? []
    : [...new Set(matchingFilters.flatMap((v) => (v.series ? [v.series] : [])))];
  const rawSeries = readParam(params.series, 120);
  const series = !activePlaylist && rawSeries && seriesOptions.includes(rawSeries) ? rawSeries : '';

  const items = series
    ? matchingFilters.filter(
        (v) => v.series === series || v.playlistIds?.some((pid) => getPlaylistById(pid)?.title === series),
      )
    : matchingFilters;

  const currentFilters: FilterState = { q, channel, kind, category, playlist, series };

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedVideoId = readParam(params.video, 80);
  const explicitSelectedIndex = requestedVideoId ? items.findIndex((video) => video.id === requestedVideoId) : -1;
  const page = explicitSelectedIndex >= 0
    ? Math.floor(explicitSelectedIndex / pageSize) + 1
    : Math.min(totalPages, Math.max(1, Number.parseInt(readParam(params.page, 10), 10) || 1));
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const selected = (explicitSelectedIndex >= 0 ? items[explicitSelectedIndex] : pageItems[0]) as Video | undefined;
  const effectiveIndex = explicitSelectedIndex >= 0 ? explicitSelectedIndex : pageItems.length > 0 ? (page - 1) * pageSize : -1;
  const prevVideo = effectiveIndex > 0 ? items[effectiveIndex - 1] : undefined;
  const nextVideo = effectiveIndex >= 0 && effectiveIndex < items.length - 1 ? items[effectiveIndex + 1] : undefined;

  const jehovahTotal = jehovahLogicChannel.videoCount;
  const archiveTotal = videos.length - jehovahTotal;
  const hasAnyFilter = Boolean(q || channel || kind || category || playlist || series);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 md:space-y-14">
      <section className="card-manuscript section-page-banner px-6 py-7 md:p-9">
        <h1 className="section-page-title font-scripture text-4xl md:text-5xl font-bold">
          <SectionArtwork name="videos" />
          فيديوهات وشرح
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-8 md:text-base">
          مكتبة مرئية تضم جميع فيديوهات وقوائم تشغيل قناة «{jehovahLogicChannel.title}» ({jehovahTotal.toLocaleString('ar-EG')} فيديو ضمن{' '}
          {jehovahLogicPlaylists.length.toLocaleString('ar-EG')} قائمة تشغيل كاملة في الدفاعيات والرد على الشبهات)، بالإضافة إلى{' '}
          {archiveTotal.toLocaleString('ar-EG')} فيديو من أرشيف البابا شنودة الثالث وأبونا داود لمعي والترانيم والألحان القبطية.
        </p>
        <div className="flex flex-wrap gap-3 mt-6 text-sm font-semibold">
          <Link href="#watch" className="brand-button">ابدأ المشاهدة</Link>
          <Link href="#playlists" className="media-action">
            <ListVideo className="w-4 h-4" aria-hidden />
            قوائم تشغيل منطق يهوه ({jehovahLogicPlaylists.length.toLocaleString('ar-EG')})
          </Link>
          <a href={jehovahLogicChannel.url} target="_blank" rel="noreferrer" className="media-action">
            <ExternalLink className="w-4 h-4" aria-hidden />
            القناة على YouTube
          </a>
          <Link href="#books" className="media-action">
            <SectionIcon name="book" />
            أهم ١٠ كتب دفاعية
          </Link>
        </div>
      </section>

      <section id="playlists" className="space-y-5 scroll-mt-24" aria-labelledby="playlists-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="playlists-heading" className="font-scripture text-3xl font-bold">
              قوائم تشغيل قناة منطق يهوه ({jehovahLogicPlaylists.length.toLocaleString('ar-EG')})
            </h2>
            <p className="media-muted text-sm mt-1">
              اضغط على أي قائمة تشغيل لتشغيل جميع حلقاتها بالترتيب داخل مشغّل الموقع.
            </p>
          </div>
          {playlist && (
            <Link href={buildVideosHref({ ...currentFilters, playlist: '', series: '', video: undefined } as FilterState, { playlist: '', series: '' })}
              className="media-action">
              عرض كل قوائم التشغيل والفيديوهات
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {jehovahLogicPlaylists.map((pl, index) => {
            const isActive = activePlaylist?.id === pl.id;
            const playHref = buildVideosHref(
              { q: '', channel: 'jehovah-logic', kind: '', category: '', playlist: pl.id, series: '' },
              { video: pl.videoIds[0] },
            );
            return (
              <article
                key={pl.id}
                className="card-manuscript overflow-hidden flex flex-col justify-between transition"
                style={isActive ? { borderColor: 'var(--accent-burgundy)', boxShadow: '0 0 0 1px var(--accent-burgundy)' } : undefined}
              >
                <Link href={playHref} className="group block">
                  <div className="relative aspect-video bg-[#201417] overflow-hidden">
                    {pl.coverVideoId && (
                      <img
                        src={youtubeThumbnailUrl(pl.coverVideoId, 'mq')}
                        alt={pl.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    <span
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                      aria-hidden
                    />
                    <span className="absolute top-2.5 start-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold bg-[#201417]/85 text-[#f1ce84] border border-[#e8c67b]/35">
                      {(index + 1).toLocaleString('ar-EG')}
                    </span>
                    <span className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-[#201417]/90 text-white border border-white/15">
                      <ListVideo className="w-3.5 h-3.5 text-[#f1ce84]" aria-hidden />
                      {pl.videoCount.toLocaleString('ar-EG')} فيديو
                    </span>
                    <span className="absolute bottom-2.5 start-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-[#f1ce84] text-[#351922]">
                      <Play className="w-3 h-3 fill-current" aria-hidden />
                      {isActive ? 'قيد التشغيل' : 'تشغيل'}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <p className="text-[11px] font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                      {videoCategories[pl.category]}
                    </p>
                    <h3 className="font-scripture text-lg font-bold leading-snug line-clamp-2 group-hover:underline">
                      {pl.title}
                    </h3>
                  </div>
                </Link>
                <div className="px-3.5 pb-3 pt-1 flex items-center justify-between gap-2 border-t text-xs"
                  style={{ borderColor: 'var(--border-hairline)' }}>
                  <Link href={playHref} className="font-bold hover:underline" style={{ color: 'var(--accent-burgundy)' }}>
                    فتح القائمة بالموقع
                  </Link>
                  <a href={pl.youtubeUrl} target="_blank" rel="noreferrer" className="media-muted inline-flex items-center gap-1 hover:underline">
                    YouTube <ExternalLink className="w-3 h-3" aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="watch" className="space-y-5 scroll-mt-24" aria-labelledby="video-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="video-heading" className="font-scripture text-3xl font-bold">
              {activePlaylist ? `قائمة تشغيل: ${activePlaylist.title}` : 'شاهد حسب الموضوع والقناة'}
            </h2>
            <p className="media-muted text-sm">
              {items.length.toLocaleString('ar-EG')} فيديو في نتائج المشاهدة
              {series && !activePlaylist ? ` · سلسلة: ${series}` : ''}
            </p>
          </div>
          <form action="/videos#watch" method="GET" className="flex gap-2 w-full md:w-auto">
            {channel && <input type="hidden" name="channel" value={channel} />}
            {kind && <input type="hidden" name="kind" value={kind} />}
            {category && <input type="hidden" name="category" value={category} />}
            {playlist && <input type="hidden" name="playlist" value={playlist} />}
            {series && <input type="hidden" name="series" value={series} />}
            <input
              type="search"
              name="q"
              aria-label="ابحث في الفيديوهات"
              defaultValue={q}
              maxLength={120}
              placeholder="ابحث في الفيديوهات وقوائم التشغيل"
              className="media-action min-w-0 flex-1"
            />
            <button type="submit" className="media-action" aria-label="بحث">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-2.5">
          <nav aria-label="المصدر والقناة" className="flex flex-wrap items-center gap-2">
            <Link
              href={buildVideosHref(currentFilters, { channel: '', playlist: '', series: '', video: undefined, page: '1' })}
              aria-current={!channel && !playlist ? 'page' : undefined}
              className={`media-action ${!channel && !playlist ? 'media-action-active' : ''}`}
            >
              كل القنوات ({videos.length.toLocaleString('ar-EG')})
            </Link>
            {Object.entries(channelFilters).map(([key, label]) => (
              <Link
                key={key}
                href={buildVideosHref(currentFilters, {
                  channel: key,
                  playlist: key === 'archive' ? '' : currentFilters.playlist,
                  series: '',
                  video: undefined,
                  page: '1',
                })}
                aria-current={channel === key ? 'page' : undefined}
                className={`media-action ${channel === key ? 'media-action-active' : ''}`}
              >
                {label}
              </Link>
            ))}
            {hasAnyFilter && (
              <Link href="/videos#watch" className="media-action" style={{ color: 'var(--accent-burgundy)' }}>
                مسح كل الفلاتر
              </Link>
            )}
          </nav>

          <nav aria-label="تصنيفات الفيديوهات" className="flex flex-wrap gap-2">
            {[['', 'كل التصنيفات'], ...Object.entries(videoCategories)].map(([key, label]) => (
              <Link
                key={key || 'all-categories'}
                href={buildVideosHref(currentFilters, { category: key, series: '', video: undefined, page: '1' })}
                aria-current={category === key ? 'page' : undefined}
                className={`media-action ${category === key ? 'media-action-active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {channel !== 'archive' && (
            <nav aria-label="نوع المقطع" className="flex flex-wrap gap-2">
              {[['', 'كل المقاطع'], ...Object.entries(videoKinds)].map(([key, label]) => (
                <Link
                  key={key || 'all-kinds'}
                  href={buildVideosHref(currentFilters, { kind: key, video: undefined, page: '1' })}
                  aria-current={kind === key ? 'page' : undefined}
                  className={`media-action text-xs ${kind === key ? 'media-action-active' : ''}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {seriesOptions.length > 0 && (
            <nav aria-label="سلاسل الفيديو" className="flex flex-wrap gap-2">
              {['', ...seriesOptions].map((name) => (
                <Link
                  key={name || 'all-series'}
                  href={buildVideosHref(currentFilters, { series: name, video: undefined, page: '1' })}
                  aria-current={series === name ? 'page' : undefined}
                  className={`media-action text-xs ${series === name ? 'media-action-active' : ''}`}
                >
                  {name || 'كل السلاسل'}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {selected ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1.15fr)] items-start">
            <article className="card-manuscript p-4 md:p-6 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold" style={{ color: 'var(--accent-burgundy)' }}>
                <span>
                  {videoCategories[selected.category]}
                  {selected.series ? ` · ${selected.series}` : ''}
                </span>
                {effectiveIndex >= 0 && (
                  <span className="rounded-full px-2.5 py-0.5 border" style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface-muted)' }}>
                    {(effectiveIndex + 1).toLocaleString('ar-EG')} / {items.length.toLocaleString('ar-EG')}
                  </span>
                )}
              </div>
              <h3 className="font-scripture text-2xl font-bold leading-relaxed">{selected.title}</h3>
              <p className="media-muted text-sm">
                {selected.credit}
                {selected.description && <> · {selected.description}</>}
              </p>
              <VideoPlayer
                key={selected.id}
                video={selected}
                prevHref={prevVideo ? buildVideosHref(currentFilters, { video: prevVideo.id, page: undefined }) : undefined}
                nextHref={nextVideo ? buildVideosHref(currentFilters, { video: nextVideo.id, page: undefined }) : undefined}
              />
            </article>

            <div className="card-manuscript p-3 md:p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-1">
                <h3 className="font-bold">
                  {activePlaylist ? activePlaylist.title : 'قائمة المشاهدة'}{' '}
                  <span className="media-muted text-xs">({items.length.toLocaleString('ar-EG')})</span>
                </h3>
                {activePlaylist && (
                  <Link href="#playlists" className="text-xs font-bold hover:underline" style={{ color: 'var(--accent-burgundy)' }}>
                    كل القوائم
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {pageItems.map((video, offset) => {
                  const absoluteNumber = (page - 1) * pageSize + offset + 1;
                  const isSelected = selected.id === video.id;
                  return (
                    <Link
                      key={video.id}
                      href={buildVideosHref(currentFilters, { video: video.id, page: undefined })}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`media-action !flex !items-center !gap-2.5 !justify-between !p-2 w-full ${isSelected ? 'media-action-active' : ''}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 flex-1">
                        {video.youtubeId ? (
                          <span className="relative w-20 aspect-video rounded overflow-hidden shrink-0 bg-[#201417]">
                            <img
                              src={youtubeThumbnailUrl(video.youtubeId, 'mq')}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 start-0.5 rounded px-1 text-[10px] font-bold bg-black/75 text-white">
                              {absoluteNumber}
                            </span>
                          </span>
                        ) : (
                          <span className="w-8 h-8 rounded-full grid place-items-center shrink-0 text-xs font-bold bg-black/10">
                            {absoluteNumber}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold leading-snug line-clamp-2">{video.title}</span>
                          <span className="block text-[11px] opacity-85 truncate mt-0.5">
                            {video.series || videoCategories[video.category]} · {video.fileUrl ? 'MP4' : kindLabel(video.kind)}
                          </span>
                        </span>
                      </span>
                      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                    </Link>
                  );
                })}
              </div>
              <Pagination
                path="/videos"
                hash="watch"
                filters={currentFilters}
                page={page}
                totalPages={totalPages}
              />
            </div>
          </div>
        ) : (
          <div className="card-manuscript p-8">
            لا توجد فيديوهات مطابقة. <Link className="underline" href="/videos#watch">امسح التصفية</Link>
          </div>
        )}
      </section>

      <section id="books" className="space-y-6 scroll-mt-24" aria-labelledby="books-heading">
        <div>
          <h2 id="books-heading" className="font-scripture text-3xl font-bold">أهم ١٠ كتب للرد والدفاع عن الإيمان</h2>
          <p className="media-muted text-sm mt-1">اقرأ الكتب داخل المنارة أو نزّلها للاحتفاظ بها والقراءة لاحقًا.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {apologeticsCollections.map((group, groupIndex) => (
            <section key={group.id} id={group.id} className="card-manuscript p-5 md:p-6 scroll-mt-24">
              <h3 className="font-scripture text-2xl font-bold">{group.title}</h3>
              <p className="media-muted text-sm mt-1">{group.intro}</p>
              <ol className="mt-4">
                {group.books.map((book, i) => (
                  <li key={book.title} className="flex gap-3 py-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <span
                      className="shrink-0 rounded-full grid place-items-center w-8 h-8 text-sm font-bold"
                      style={{ background: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
                    >
                      {(groupIndex * 5 + i + 1).toLocaleString('ar-EG')}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-bold">{book.title}</h4>
                      <p className="media-muted text-xs">{book.author}</p>
                      <p className="text-sm">{book.description}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link className="media-action media-action-active" href={`/library/${encodeURIComponent(book.slug)}/read`}>
                          <BookOpen className="w-4 h-4" aria-hidden /> اقرأ داخل الموقع
                        </Link>
                        <a className="media-action" href={`/library/${encodeURIComponent(book.slug)}/file/download`}>
                          <Download className="w-4 h-4" aria-hidden /> تحميل الكتاب
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
