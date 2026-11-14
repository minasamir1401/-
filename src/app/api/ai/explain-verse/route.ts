import { z } from 'zod';
import { explainBibleVerseWithAi } from '@/lib/server/orthodox-ai/service';

const ExplainVerseRequestSchema = z.object({
  bookSlug: z.string().trim().min(1, 'يرجى تحديد السفر').max(100),
  chapter: z.number().int().min(1).max(200),
  verseNumber: z.number().int().min(1).max(300),
  selectedText: z.string().trim().max(1500).optional(),
  followUp: z.string().trim().max(1500).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().min(1).max(4000),
      }),
    )
    .max(8)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ExplainVerseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'بيانات الآية غير صالحة' },
      { status: 400 },
    );
  }

  try {
    const result = await explainBibleVerseWithAi(parsed.data);
    if (!result) {
      return Response.json({ error: 'الآية أو السفر غير موجود' }, { status: 404 });
    }
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'تعذر شرح الآية عبر الذكاء الاصطناعي حالياً' },
      { status: 502 },
    );
  }
}
