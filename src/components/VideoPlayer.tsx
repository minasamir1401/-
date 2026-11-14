'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clapperboard, Download, ExternalLink, Play } from 'lucide-react';
import { youtubeThumbnailUrl, youtubeWatchUrl, type Video } from '@/lib/media-catalog';
import { useAudioPlayer } from './AudioPlayerContext';

export function VideoPlayer({
  video,
  prevHref,
  nextHref,
}: {
  video: Video;
  prevHref?: string;
  nextHref?: string;
}) {
  const [mode, setMode] = useState<'idle' | 'file' | 'youtube'>('idle');
  const [error, setError] = useState(false);
  const audio = useAudioPlayer();
  const choose = (next: 'file' | 'youtube') => {
    if (audio.isPlaying) audio.togglePlay();
    setError(false);
    setMode(next);
  };
  const watch = video.youtubeId ? youtubeWatchUrl(video.youtubeId) : undefined;
  const thumb = video.youtubeId ? youtubeThumbnailUrl(video.youtubeId, 'hq') : undefined;
  const primary = video.fileUrl ? 'file' : 'youtube';

  return (
    <div>
      <div className="aspect-video bg-[#201417] overflow-hidden relative rounded-xl border border-white/10">
        {mode === 'file' && video.fileUrl && (
          <video
            key={video.id}
            src={`/videos/download/${video.id}?play=1`}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full"
            aria-label={video.title}
            onError={() => setError(true)}
          />
        )}
        {mode === 'youtube' && video.youtubeId && (
          <iframe
            className="w-full h-full"
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
        {mode === 'idle' && (
          <button
            type="button"
            onClick={() => choose(primary)}
            className="group w-full h-full flex flex-col items-center justify-center gap-3 text-white relative"
            aria-label={`شغّل ${video.title}`}
          >
            {thumb && (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}
            <span
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(32,20,23,0.42), rgba(20,11,14,0.84))',
              }}
              aria-hidden
            />
            <Clapperboard className="absolute top-5 end-5 w-9 h-9 text-[#e8c67b]/70 z-10" aria-hidden />
            {video.kind === 'short' && (
              <span
                className="absolute top-5 start-5 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[#e8c67b]/40 bg-[#201417]/80 text-[#f1ce84]"
              >
                Shorts
              </span>
            )}
            {video.kind === 'stream' && (
              <span
                className="absolute top-5 start-5 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[#e8c67b]/40 bg-[#201417]/80 text-[#f1ce84]"
              >
                بث مباشر مسجل
              </span>
            )}
            <span className="relative z-10 grid place-items-center rounded-full w-16 h-16 bg-[#f1ce84] text-[#351922] shadow-lg transition-transform group-hover:scale-105">
              <Play className="w-7 h-7 fill-current" aria-hidden />
            </span>
            <span className="relative z-10 text-sm font-bold drop-shadow">
              {video.fileUrl ? 'شغّل في مشغّل المنارة' : 'شغّل الفيديو الآن'}
            </span>
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm mt-3">تعذّر تشغيل الملف. جرّب المشاهدة من صفحة المصدر.</p>}
      <div className="flex flex-wrap items-center gap-2 pt-4">
        {prevHref && (
          <Link className="media-action" href={prevHref}>
            <ChevronRight className="w-4 h-4" aria-hidden /> السابق
          </Link>
        )}
        {nextHref && (
          <Link className="media-action media-action-active" href={nextHref}>
            التالي <ChevronLeft className="w-4 h-4" aria-hidden />
          </Link>
        )}
        {video.fileUrl && (
          <a className="media-action" href={`/videos/download/${video.id}`}>
            <Download className="w-4 h-4" aria-hidden /> تحميل MP4
          </a>
        )}
        {watch && video.fileUrl && (
          <button
            type="button"
            className="media-action"
            aria-pressed={mode === 'youtube'}
            onClick={() => choose(mode === 'youtube' ? 'file' : 'youtube')}
          >
            {mode === 'youtube' ? 'مشغّل المنارة' : 'مشغّل YouTube'}
          </button>
        )}
        {(video.sourceUrl || watch) && (
          <a className="media-action" href={video.sourceUrl || watch} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4" aria-hidden /> {video.sourceUrl ? 'صفحة المصدر' : 'فتح على YouTube'}
          </a>
        )}
      </div>
    </div>
  );
}
