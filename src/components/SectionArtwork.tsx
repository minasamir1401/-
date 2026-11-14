export type SectionArtworkName =
  | 'calendar'
  | 'audio'
  | 'library'
  | 'bible'
  | 'explanations'
  | 'videos'
  | 'liturgy'
  | 'sermons'
  | 'ai'
  | 'apologetics'
  | 'catechism'
  | 'commentaries'
  | 'synaxarium'
  | 'ask'
  | 'beacon';

export function SectionArtwork({
  name,
  className = '',
  size = 192,
}: {
  name: SectionArtworkName;
  className?: string;
  size?: number;
}) {
  return (
    <img
      className={className ? `section-artwork ${className}` : 'section-artwork'}
      src={`/design/sections/${name}.webp`}
      width={size}
      height={size}
      alt=""
      decoding="async"
    />
  );
}
