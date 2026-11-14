import type { ReactNode } from 'react';

const icons = {
  home: <><path d="m3 11 9-8 9 8M5.5 10v10h13V10M10 20v-6h4v6" /></>,
  bible: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M5 18h14M12 6v8m-3-5h6" /></>,
  library: <><rect x="2.5" y="5" width="4" height="16" rx=".7" /><rect x="6.5" y="2.5" width="5" height="18.5" rx=".7" /><rect x="11.5" y="4" width="4.5" height="17" rx=".7" /><path d="m16 6 3.4-1.3L24 19l-3.7 1.5z" /></>,
  explanations: <><path d="M4 3.5h16A2 2 0 0 1 22 5.5v10a2 2 0 0 1-2 2h-9l-5 4v-4H4a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z" /><path d="M7 8h10m-10 4h7" /></>,
  sermons: <><path d="M3 13v-2a9 9 0 1 1 18 0v2" /><rect x="2" y="12" width="5" height="8" rx="2" /><rect x="17" y="12" width="5" height="8" rx="2" /></>,
  videos: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="m10 9 5 3-5 3Z" /></>,
  liturgy: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4m8-4v4" /></>,
  book: <><path d="M12 6c-3-3-6-4-10-3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-4-1-7 0-10 3Zm0 0v15" /></>,
  layers: <><path d="m12 2 10 5-10 5L2 7Zm-10 10 10 5 10-5M2 17l10 5 10-5" /></>,
  candle: <><path d="M9 11h6v10H9zM7 21h10M12 9c-2 0-3-1-2.5-2.5S12 4 12 2c1 2 3 4 2.5 5.5S13 9 12 9Z" /></>,
  chalice: <><path d="M4 3h16l-2 6c-1 3-3 5-6 5S7 12 6 9L4 3Zm2 5h12m-6 6v6m-5 1h10" /></>,
  article: <><rect x="4" y="2.5" width="16" height="19" rx="1" /><path d="M7.5 7h9m-9 3h9m-9 3h9m-9 3h5" /></>,
  microphone: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5.5 11v1.5a6.5 6.5 0 0 0 13 0V11M12 19v3m-3 0h6" /></>,
  cross: <><path d="m12 2 3 3-2 2v3h4l2-2 3 3-3 3-2-2h-4v4l2 2-3 4-3-4 2-2v-4H7l-2 2-3-3 3-3 2 2h4V7L9 5Z" /></>,
  agpeya: <><path d="M12 21c-3-2-6-3-10-2V5c4-1 7 0 10 2 3-2 6-3 10-2v14c-4-1-7 0-10 2Zm0-14v14M6 9l3 1m-3 3 3 1m6-4 3-1m-3 5 3-1" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  shield: <><path d="M12 2.5 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3.5Z" /><path d="M12 8v7m-3-4h6" /></>,
  synaxarium: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7.5h8M8 11.5h8M8 15.5h5" /></>,
  commentary: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M9 8h7m-7 3.5h5" /></>,
  ask: <><path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><path d="M10.2 9.2a1.8 1.8 0 1 1 2.7 1.5c-.6.3-.9.7-.9 1.3v.4" /><circle cx="12" cy="14.6" r=".4" /></>,
  ai: <><path d="m12 3 1.9 4.7L18.6 9.6l-4.7 1.9L12 16.2l-1.9-4.7L5.4 9.6l4.7-1.9Z" /><path d="M12 6.5v6.2M9.5 9.6h5M18.5 16l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z" /></>,
  info: <><circle cx="12" cy="12" r="9.5" /><path d="M12 10.5v6" /><circle cx="12" cy="7.5" r=".5" /></>,
} satisfies Record<string, ReactNode>;

export type SectionIconName = keyof typeof icons;

export function SectionIcon({ name, className = '' }: { name: SectionIconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={`section-icon ${className}`} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}
