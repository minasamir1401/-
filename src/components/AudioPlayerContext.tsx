'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, X } from 'lucide-react';
import { getPublicApiBase } from '@/lib/api-client';

export interface AudioTrack {
  slug: string;
  title: string;
  preacherName: string;
  mediaUrl: string;
}

interface AudioPlayerContextValue {
  track: AudioTrack | null;
  isPlaying: boolean;
  playTrack: (next: AudioTrack) => void;
  togglePlay: () => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [playerHeight, setPlayerHeight] = useState(128);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const observer = new ResizeObserver(() => setPlayerHeight(player.getBoundingClientRect().height));
    observer.observe(player);
    return () => observer.disconnect();
  }, [track]);

  const playTrack = (next: AudioTrack) => {
    setTrack(next);
    setProgress(0);
    setDuration(0);
    setHasError(false);
    fetch(`${getPublicApiBase()}/api/sermons/${encodeURIComponent(next.slug)}/play`, {
      method: 'POST',
    }).catch(() => {});
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = track.mediaUrl;
    audio.play().catch((error: DOMException) => {
      if (error.name !== 'AbortError') setIsPlaying(false);
    });
  }, [track]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const closePlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const fmt = (s: number) => {
    if (!s || !Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  return (
    <AudioPlayerContext.Provider value={{ track, isPlaying, playTrack, togglePlay, closePlayer }}>
      <div className="min-h-screen min-w-0 flex flex-col" style={track ? {
        paddingBottom: playerHeight,
        '--audio-player-height': `${playerHeight}px`,
      } as React.CSSProperties : undefined}>{children}</div>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => { setIsPlaying(false); setHasError(true); }}
        onEnded={() => setIsPlaying(false)}
      />
      {track && (
        <div
          ref={playerRef}
          className="audio-player fixed bottom-0 inset-x-0 z-50 border-t shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="audio-player-controls max-w-7xl mx-auto px-4 py-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 transition"
              style={{ backgroundColor: 'var(--accent-burgundy)' }}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{track.title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {track.preacherName}
              </p>
              {hasError && <p role="alert" className="text-xs">تعذّر تشغيل التسجيل. <a href={track.mediaUrl} target="_blank" rel="noreferrer" className="underline">افتح الملف من المصدر</a></p>}
            </div>

            <div className="audio-player-seek min-w-0 flex items-center gap-2 text-xs" dir="ltr">
              <span className="tabular-nums">{fmt(progress)}</span>
              <input
                type="range"
                aria-label="موضع التشغيل"
                min={0}
                max={duration || 1}
                disabled={!duration}
                value={progress}
                onChange={(e) => {
                  const nextTime = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = nextTime;
                  setProgress(nextTime);
                }}
                className="min-w-0 w-full flex-1 accent-[#7A1E24]"
              />
              <span className="tabular-nums">{fmt(duration)}</span>
            </div>

            <div className="hidden md:flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Volume2 className="w-4 h-4" />
              <input type="range" min={0} max={1} step={0.05} value={volume} aria-label="مستوى الصوت"
                className="w-20 accent-[#7A1E24]" onChange={(e) => {
                  const next = Number(e.target.value);
                  setVolume(next);
                  if (audioRef.current) audioRef.current.volume = next;
                }} />
            </div>

            <button
              onClick={closePlayer}
              aria-label="إغلاق المشغل"
              className="audio-player-close p-1.5 rounded-md hover:opacity-75"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}
