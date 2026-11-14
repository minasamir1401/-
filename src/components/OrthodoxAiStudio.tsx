'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCw, Send } from 'lucide-react';
import { type OrthodoxAiCitationDto, postClientApi } from '@/lib/api-client';
import { SectionArtwork } from './SectionArtwork';

type AiMode = 'apologetics' | 'dogma' | 'bible' | 'pastoral';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: OrthodoxAiCitationDto[];
}

const MODES: Array<{ key: AiMode; label: string; desc: string }> = [
  { key: 'apologetics', label: 'الرد على الشبهات', desc: 'دفاعيات مسيحية أرثوذكسية موثقة ومقارنة أديان' },
  { key: 'dogma', label: 'العقيدة واللاهوت', desc: 'الثالوث، التجسد، الفداء، الأسرار، والمجامع' },
  { key: 'bible', label: 'التفسير والآباء', desc: 'شرح كتابي وآبائي وفق الكنيسة القبطية' },
  { key: 'pastoral', label: 'تثبيت ورعاية', desc: 'تثبيت في الإيمان المسيحي وإرشاد روحي' },
];

const STARTER_PROMPTS = [
  'كيف تثبت عقيدة التثليث والتوحيد وأن المسيح هو الله الظاهر في الجسد؟',
  'أفكر في ترك المسيحية بسبب بعض الشكوك، ماذا تقول لي؟',
  'أنا من خلفية غير مسيحية وأريد أن أكون مسيحياً أرثوذكسياً، هل هذا صحيح وماذا أفعل؟',
  'ما الرد الموثق على شبهة تحريف الكتاب المقدس؟',
];

function renderFormattedLine(line: string, lineIndex: number) {
  const cleaned = line.replace(/^#{1,4}\s*/, '');
  const isHeading = /^#{1,4}\s+/.test(line);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);

  const children = parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx} style={{ color: 'var(--heading-ink)' }}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });

  if (isHeading) {
    return (
      <h4 key={lineIndex} className="font-scripture text-base font-bold pt-2" style={{ color: 'var(--accent-burgundy)' }}>
        {children}
      </h4>
    );
  }
  return <p key={lineIndex} className="leading-7">{children}</p>;
}

export function OrthodoxAiStudio() {
  const [mode, setMode] = useState<AiMode>('apologetics');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const sendMessage = async (overrideText?: string) => {
    const prompt = (overrideText ?? input).trim();
    if (!prompt || sending) return;

    setChatError(null);
    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!overrideText) setInput('');
    setSending(true);

    try {
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await postClientApi<{
        reply: string;
        citations: OrthodoxAiCitationDto[];
      }>('/api/ai/chat', {
        message: prompt,
        mode,
        history: historyPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: res.reply,
          citations: res.citations,
        },
      ]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'تعذر الاتصال بخدمة المرشد الذكي حالياً.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <section className="card-manuscript p-5 md:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
        <div className="space-y-0.5">
          <h2 className="font-scripture text-xl font-bold flex items-center gap-2" style={{ color: 'var(--accent-burgundy)' }}>
            <SectionArtwork name="ai" className="w-9 h-9" size={96} />
            <span>الحوار العقيدي والدفاعي المباشر</span>
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            مدعوم بمكتبة الشبهات والكتاب المقدس داخل المنارة الأرثوذكسية للرد الموثق على أسئلتك.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setChatError(null);
          }}
          className="media-action text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>محادثة جديدة</span>
        </button>
      </div>

        {/* Mode Selector */}
        <div className="grid gap-2 sm:grid-cols-4">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className="text-start rounded-lg border p-2.5 transition"
                style={{
                  borderColor: active ? 'var(--accent-burgundy)' : 'var(--border-hairline)',
                  backgroundColor: active ? 'var(--bg-surface-muted)' : 'var(--bg-surface)',
                }}
              >
                <div className="text-xs font-bold" style={{ color: active ? 'var(--accent-burgundy)' : 'var(--heading-ink)' }}>
                  {m.label}
                </div>
                <div className="text-[11px] leading-4 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Starter Prompts */}
        {messages.length === 0 && (
          <div className="space-y-2.5 py-2">
            <div className="text-xs font-bold" style={{ color: 'var(--accent-gold)' }}>
              أسئلة مقترحة للبداية:
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {STARTER_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="text-start text-xs leading-6 rounded-lg border p-3 hover:opacity-90 transition"
                  style={{
                    borderColor: 'var(--border-hairline)',
                    backgroundColor: 'var(--bg-surface-muted)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 max-h-[34rem] overflow-y-auto pe-1">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`motion-chat-msg rounded-xl border p-4 space-y-2.5 ${isUser ? 'ms-6' : 'me-2'}`}
                  style={{
                    borderColor: isUser ? 'var(--accent-gold)' : 'var(--border-hairline)',
                    backgroundColor: isUser ? 'var(--bg-surface-muted)' : 'var(--bg-surface)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold" style={{ color: isUser ? 'var(--accent-gold)' : 'var(--accent-burgundy)' }}>
                      {isUser ? 'سؤالك' : 'المرشد الأرثوذكسي'}
                    </span>
                  </div>

                  <div className="text-sm space-y-2">
                    {msg.text
                      .split(/\n+/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, i) => renderFormattedLine(line, i))}
                  </div>

                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 border-t space-y-1.5" style={{ borderColor: 'var(--border-hairline)' }}>
                      <div className="text-[11px] font-bold" style={{ color: 'var(--accent-gold)' }}>
                        مراجع ومصادر مرتبطة من مكتبة المنارة:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c) => (
                          <Link
                            key={`${c.url}-${c.title}`}
                            href={c.url}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] hover:underline"
                            style={{
                              borderColor: 'var(--border-hairline)',
                              backgroundColor: 'var(--bg-surface-muted)',
                              color: 'var(--accent-burgundy)',
                            }}
                          >
                            <span>{c.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div
                className="rounded-xl border p-4 text-xs"
                style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface-muted)', color: 'var(--text-muted)' }}
              >
                جارٍ صياغة الرد الأرثوذكسي الموثق ومراجعة الشواهد الكتابية والآبائية...
              </div>
            )}
          </div>
        )}

        {chatError && (
          <div
            role="alert"
            className="rounded-lg border px-4 py-3 text-xs font-medium"
            style={{ borderColor: 'var(--accent-burgundy)', backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
          >
            {chatError}
          </div>
        )}

        {/* Composer */}
        <form onSubmit={handleSubmitChat} className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="اكتب سؤالك العقيدي أو الكتابي أو الشبهة التي تريد الرد عليها... (Enter للإرسال)"
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              إجابات موثقة من الكتاب المقدس وتقليد الآباء وعقيدة الكنيسة القبطية الأرثوذكسية.
            </span>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="brand-button text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'جارٍ الرد...' : 'إرسال السؤال'}</span>
            </button>
          </div>
        </form>
      </section>
  );
}
