'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Send } from 'lucide-react';
import { postClientApi } from '@/lib/api-client';

const QUESTION_CATEGORIES = [
  'الثالوث ولاهوت المسيح',
  'الكتاب المقدس والمخطوطات والأبوكريفا',
  'التجسد والفداء والصليب والقيامة',
  'الإلحاد ووجود الله والعلم',
  'اللاهوت المقارن والبدع الحديثة',
  'التاريخ الكنسي والآباء والليتورجيا',
  'شبهة عامة',
];

export function AskQuestionForm() {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [category, setCategory] = useState(QUESTION_CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedInfo, setSubmittedInfo] = useState<{ id: number; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await postClientApi<{ ok: boolean; id: number; message: string }>('/api/questions', {
        senderName,
        senderEmail,
        category,
        subject,
        referenceUrl,
        message,
      });
      setSubmittedInfo({ id: res.id, message: res.message });
      setSubject('');
      setReferenceUrl('');
      setMessage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر إرسال السؤال، يرجى المحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedInfo) {
    return (
      <div className="card-manuscript p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 font-scripture text-2xl font-bold" style={{ color: 'var(--accent-burgundy)' }}>
          <CheckCircle2 className="w-6 h-6" />
          <span>تم استلام سؤالك بنجاح (#{submittedInfo.id})</span>
        </div>
        <p className="text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
          {submittedInfo.message}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSubmittedInfo(null)}
            className="brand-button text-xs"
          >
            إرسال سؤال آخر
          </button>
          <Link href="/apologetics" className="media-action text-xs">
            تصفح الردود الموثقة الحالية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-manuscript p-6 md:p-8 space-y-5">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border px-4 py-3 text-sm font-medium"
          style={{ borderColor: 'var(--accent-burgundy)', backgroundColor: 'var(--bg-surface-muted)', color: 'var(--accent-burgundy)' }}
        >
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-bold block">الاسم *</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="مثال: مينا مرقس"
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-bold block">البريد الإلكتروني (اختياري)</span>
          <input
            type="email"
            maxLength={160}
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-bold block">المحور العقيدي أو الكتابي</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          >
            {QUESTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-bold block">الشاهد الكتابي أو رابط المرجع (اختياري)</span>
          <input
            type="text"
            maxLength={300}
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="مثال: يوحنا 14: 28 أو تثنية 18: 18"
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
          />
        </label>
      </div>

      <label className="space-y-1.5 text-sm block">
        <span className="font-bold block">عنوان الشبهة أو السؤال *</span>
        <input
          type="text"
          required
          minLength={4}
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="مثال: كيف نفهم قول السيد المسيح أبي أعظم مني؟"
          className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
        />
      </label>

      <label className="space-y-1.5 text-sm block">
        <span className="font-bold block">نص السؤال بالتفصيل *</span>
        <textarea
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب نص الاعتراض أو الشاهد أو النقطة التي تحتاج لتوضيح آبائي ولاهوتي..."
          className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none leading-7"
          style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-parchment)' }}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          تحفظ الأسئلة للمراجعة العلمية وتحديث قسم الرد على الشبهات.
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="brand-button text-sm px-6 py-2.5 disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'جاري الإرسال...' : 'إرسال السؤال للمراجعة'}</span>
        </button>
      </div>
    </form>
  );
}
