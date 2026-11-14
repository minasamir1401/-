'use client';

import { Play, Pause } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';

export function SermonPlayButton({
  slug,
  title,
  preacherName,
  mediaUrl,
}: {
  slug: string;
  title: string;
  preacherName: string;
  mediaUrl: string;
}) {
  const { track, isPlaying, playTrack, togglePlay } = useAudioPlayer();
  const isCurrent = track?.slug === slug;

  const handleClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack({ slug, title, preacherName, mediaUrl });
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={`${isCurrent && isPlaying ? 'إيقاف مؤقت' : 'استمع إلى'}: ${title}`}
      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition"
      style={{ backgroundColor: 'var(--accent-burgundy)' }}
    >
      {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      <span>{isCurrent && isPlaying ? 'إيقاف مؤقت' : 'استماع'}</span>
    </button>
  );
}
