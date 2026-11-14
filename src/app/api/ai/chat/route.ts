import { z } from 'zod';
import { runOrthodoxAiChat, type OrthodoxAiMode } from '@/lib/server/orthodox-ai/service';

const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, 'يرجى كتابة سؤالك أولاً').max(4000, 'الرسالة طويلة جداً'),
  mode: z.enum(['apologetics', 'dogma', 'bible', 'pastoral']).optional().default('apologetics'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'صيغة الطلب غير صالحة' },
      { status: 400 },
    );
  }

  try {
    const answer = await runOrthodoxAiChat({
      message: parsed.data.message,
      history: parsed.data.history,
      mode: parsed.data.mode as OrthodoxAiMode,
    });
    return Response.json({
      reply: answer.reply,
      model: answer.model,
      citations: answer.citations,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'تعذر الحصول على رد من Gemini حالياً' },
      { status: 502 },
    );
  }
}
