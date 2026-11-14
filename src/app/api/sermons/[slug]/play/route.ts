import { recordSermonPlay } from '@/lib/server/handlers/sermons';
import { routeErrorResponse } from '@/lib/server/next-route';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const updated = await recordSermonPlay(slug);
    return Response.json(updated, { status: 200 });
  } catch (err) {
    return routeErrorResponse(err);
  }
}
