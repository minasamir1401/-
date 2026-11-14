import { z } from 'zod';
import { deleteApiKey, listMaskedKeys, toggleApiKeyActive } from '@/lib/server/orthodox-ai/gemini-pool';

const UpdateKeySchema = z.object({
  isActive: z.boolean().optional(),
  label: z.string().trim().min(1).max(80).optional(),
});

function isKeyMutationAuthorized(request: Request): boolean {
  if (process.env.AI_ADMIN_PROTECT !== 'true') return true;
  const expected = process.env.ADMIN_KEY;
  return Boolean(expected && request.headers.get('x-admin-key') === expected);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKeyMutationAuthorized(request)) {
    return Response.json({ error: 'غير مصرح بتعديل المفاتيح' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: 'معرف المفتاح غير صالح' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'بيانات التحديث غير صالحة' }, { status: 400 });
  }

  const pool = await toggleApiKeyActive(id, parsed.data.isActive, parsed.data.label);
  if (!pool) return Response.json({ error: 'المفتاح غير موجود' }, { status: 404 });
  return Response.json({ ok: true, pool });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isKeyMutationAuthorized(request)) {
    return Response.json({ error: 'غير مصرح بحذف المفاتيح' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: 'معرف المفتاح غير صالح' }, { status: 400 });
  }

  const removed = await deleteApiKey(id);
  if (!removed) return Response.json({ error: 'المفتاح غير موجود' }, { status: 404 });
  const pool = await listMaskedKeys();
  return Response.json({ ok: true, pool });
}
