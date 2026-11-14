import { z } from 'zod';
import { addApiKeys, listMaskedKeys } from '@/lib/server/orthodox-ai/gemini-pool';

const AddKeysSchema = z.object({
  apiKeys: z.string().trim().min(16, 'يرجى إدخال مفتاح Gemini API صالح واحد على الأقل').max(8000),
  label: z.string().trim().max(80).optional(),
});

function isKeyMutationAuthorized(request: Request): boolean {
  if (process.env.AI_ADMIN_PROTECT !== 'true') return true;
  const expected = process.env.ADMIN_KEY;
  return Boolean(expected && request.headers.get('x-admin-key') === expected);
}

export async function GET() {
  try {
    const pool = await listMaskedKeys();
    return Response.json(pool);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'تعذر قراءة مفاتيح الذكاء الاصطناعي' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isKeyMutationAuthorized(request)) {
    return Response.json({ error: 'غير مصرح بإدارة مفاتيح الذكاء الاصطناعي' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = AddKeysSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'بيانات المفاتيح غير مكتملة' },
      { status: 400 },
    );
  }

  try {
    const result = await addApiKeys(parsed.data.apiKeys, parsed.data.label);
    const pool = await listMaskedKeys();
    return Response.json({ ...result, pool }, { status: result.added.length ? 201 : 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'تعذر إضافة المفاتيح' },
      { status: 400 },
    );
  }
}
