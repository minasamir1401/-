'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ExternalLink,
  Maximize2,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { type OrthodoxAiCitationDto, postClientApi } from '@/lib/api-client';
import { useAudioPlayer } from './AudioPlayerContext';
import { SectionArtwork } from './SectionArtwork';

type QuickMode = 'apologetics' | 'dogma' | 'bible' | 'pastoral';

interface QuickMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: OrthodoxAiCitationDto[];
}

const QUICK_MODES: Array<{ key: QuickMode; label: string }> = [
  { key: 'apologetics', label: 'الرد على الشبهات' },
  { key: 'dogma', label: 'العقيدة' },
  { key: 'bible', label: 'التفسير والآباء' },
  { key: 'pastoral', label: 'تثبيت ورعاية' },
];

const QUICK_STARTERS = [
  'كيف تثبت ألوهية السيد المسيح وعقيدة الثالوث من الكتاب المقدس؟',
  'أفكر في ترك المسيحية بسبب بعض الشبهات، ماذا تقول لي؟',
  'أنا من خلفية غير مسيحية وأريد أن أكون مسيحياً أرثوذكسياً، هل هذا صحيح؟',
];

function renderBoldText(line: string) {
  const cleaned = line.replace(/^#{1,4}\s*/, '');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function FloatingAiWidget() {
  const pathname = usePathname();
  const { track } = useAudioPlayer();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<QuickMode>('apologetics');
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  if (pathname === '/ai') {
    return null;
  }

  const bottomOffsetClass = track ? 'bottom-24 sm:bottom-20' : 'bottom-5';

  const handleSend = async (overrideText?: string) => {
    const prompt = (overrideText ?? input).trim();
    if (!prompt || sending) return;

    setError(null);
    const userMsg: QuickMessage = {
      id: `wu-${Date.now()}`,
      role: 'user',
      text: prompt,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!overrideText) setInput('');
    setSending(true);

    try {
      const res = await postClientApi<{
        reply: string;
        citations?: OrthodoxAiCitationDto[];
      }>('/api/ai/chat', {
        message: prompt,
        mode,
        history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `wm-${Date.now()}`,
          role: 'model',
          text: res.reply,
          citations: res.citations,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاتصال بالمرشد الذكي حالياً.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed left-4 sm:left-6 ${bottomOffsetClass} z-40`}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="افتح المحادثة مع الذكاء الاصطناعي الأرثوذكسي"
          className="ai-floating-orb flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-xl border-2 transition-transform hover:scale-105 cursor-pointer"
          style={{
            backgroundColor: 'var(--accent-burgundy)',
            borderColor: 'var(--accent-gold)',
          }}
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-parchment)',
              borderColor: 'var(--accent-gold)',
            }}
          >
            <SectionArtwork name="ai" className="w-6 h-6" size={64} />
          </span>
          <span>كلم AI الأرثوذكسي</span>
          <Sparkles className="w-4 h-4 opacity-90" />
        </button>
      ) : (
        <section
          aria-label="نافذة الحوار السريع مع الذكاء الاصطناعي الأرثوذكسي"
          className="ai-drawer-enter w-[min(93vw,430px)] max-h-[76vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--accent-gold)',
          }}
        >
          <header
            className="px-4 py-3 flex items-center justify-between gap-2 text-white"
            style={{ backgroundColor: 'var(--accent-burgundy)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: 'var(--bg-parchment)',
                  borderColor: 'var(--accent-gold)',
                }}
              >
                <SectionArtwork name="ai" className="w-6 h-6" size={64} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">المرشد الأرثوذكسي AI</div>
                <div className="text-[11px] opacity-85 truncate">إجابات موثقة بالعقيدة والكتاب المقدس</div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/ai"
                onClick={() => setOpen(false)}
                title="فتح صفحة AI الكاملة"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold hover:opacity-90"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>الاستوديو</span>
              </Link>
              <button
                type="button"
                onClick={() => { setMessages([]); setError(null); }}
                aria-label="محادثة جديدة"
                title="محادثة جديدة"
                className="p-1.5 rounded-lg hover:opacity-80"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق نافذة AI"
                className="p-1.5 rounded-lg hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div
            className="px-3 py-2 border-b flex flex-wrap gap-1.5"
            style={{
              backgroundColor: 'var(--bg-surface-muted)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {QUICK_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition"
                style={{
                  borderColor: mode === m.key ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                  backgroundColor: mode === m.key ? 'var(--accent-burgundy)' : 'var(--bg-surface)',
                  color: mode === m.key ? '#ffffff' : 'var(--heading-ink)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs leading-6" style={{ color: 'var(--text-muted)' }}>
                  اسأل أي سؤال عن الإيمان المسيحي الأرثوذكسي، الكتاب المقدس، الرد على الشبهات، أو اطلب مشورة روحية مباشرة:
                </p>
                <div className="space-y-1.5">
                  {QUICK_STARTERS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="w-full text-start rounded-lg border p-2.5 text-xs leading-5 hover:opacity-90 transition"
                      style={{
                        backgroundColor: 'var(--bg-surface-muted)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--heading-ink)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`motion-chat-msg rounded-xl border p-3 space-y-2 ${isUser ? 'ms-5' : 'me-2'}`}
                    style={{
                      backgroundColor: isUser ? 'var(--bg-surface-muted)' : 'var(--bg-surface)',
                      borderColor: isUser ? 'var(--accent-gold)' : 'var(--border-hairline)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className="font-bold"
                        style={{ color: isUser ? 'var(--accent-gold)' : 'var(--accent-burgundy)' }}
                      >
                        {isUser ? 'سؤالك' : 'المرشد الأرثوذكسي'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 leading-6">
                      {msg.text
                        .split(/\n+/)
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <p key={i}>{renderBoldText(line)}</p>
                        ))}
                    </div>

                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'var(--border-hairline)' }}>
                        {msg.citations.slice(0, 3).map((c) => (
                          <Link
                            key={`${c.url}-${c.title}`}
                            href={c.url}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] border hover:underline"
                            style={{
                              borderColor: 'var(--border-hairline)',
                              backgroundColor: 'var(--bg-surface-muted)',
                              color: 'var(--accent-burgundy)',
                            }}
                          >
                            <span className="truncate max-w-[180px]">{c.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {sending && (
              <div
                className="rounded-xl border p-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-muted)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-muted)',
                }}
              >
                جارٍ البحث في المراجع الأرثوذكسية وصياغة الرد...
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg border p-2.5 text-xs" style={{ borderColor: 'var(--accent-burgundy)' }}>
                {error}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-2.5 border-t flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-surface-muted)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا لـ AI..."
              className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="إرسال السؤال"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-burgundy)' }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
