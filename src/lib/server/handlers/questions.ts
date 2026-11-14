import { z } from 'zod';
import { prisma } from '../prisma';
import { RouteError } from '../route-error';

const createQuestionSchema = z.object({
  senderName: z.string().trim().min(2, 'يرجى إدخال الاسم').max(120),
  senderEmail: z.string().trim().email('البريد الإلكتروني غير صالح').max(160).optional().or(z.literal('')),
  category: z.string().trim().min(2).max(80).default('شبهة عامة'),
  subject: z.string().trim().min(4, 'يرجى كتابة عنوان مختصر للسؤال').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'يرجى كتابة السؤال أو الشبهة بتفصيل كافٍ (10 أحرف على الأقل).')
    .max(4000, 'الحد الأقصى للسؤال 4000 حرف.'),
  referenceUrl: z.string().trim().max(300).optional().or(z.literal('')),
});

export async function createQuestion(body: unknown) {
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    throw new RouteError(400, parsed.error.issues[0]?.message || 'بيانات النموذج غير مكتملة');
  }

  const { senderName, senderEmail, category, subject, message, referenceUrl } = parsed.data;
  const created = await prisma.userQuestion.create({
    data: {
      senderName,
      senderEmail: senderEmail || null,
      category: category || 'شبهة عامة',
      subject,
      message,
      referenceUrl: referenceUrl || null,
      status: 'PENDING',
    },
    select: {
      id: true,
      category: true,
      subject: true,
      createdAt: true,
    },
  });

  return {
    ok: true,
    id: created.id,
    message: 'تم تسجيل سؤالك بنجاح للمراجعة والرد الموثق في قسم الدفاعيات.',
  };
}

export async function getQuestionsStats() {
  const totalReceived = await prisma.userQuestion.count();
  return { totalReceived };
}
