import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.userId,
        ...(unreadOnly ? { status: { in: ['QUEUED', 'SENT'] } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, status: { in: ['QUEUED', 'SENT'] } },
    });

    return jsonSuccess({ notifications, unreadCount });
  } catch (err: any) {
    return jsonError(err.message, 'NOTIFICATIONS_ERROR', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);

    const body = await req.json().catch(() => ({}));
    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.userId, status: { in: ['QUEUED', 'SENT'] } },
        data: { status: 'READ' },
      });
      return jsonSuccess({ markedRead: true });
    }
    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: { id: body.notificationId, userId: session.userId },
        data: { status: 'READ' },
      });
      return jsonSuccess({ markedRead: true });
    }
    return jsonError('Nothing to update.', 'INVALID_PARAMS', 400);
  } catch (err: any) {
    return jsonError(err.message, 'NOTIFICATIONS_UPDATE_ERROR', 500);
  }
}
