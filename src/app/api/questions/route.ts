import { createQuestion } from '@/lib/server/handlers/questions';
import { routeErrorResponse } from '@/lib/server/next-route';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const created = await createQuestion(body);
    return Response.json(created, { status: 201 });
  } catch (err) {
    return routeErrorResponse(err, 'تعذر تسجيل السؤال حالياً');
  }
}
