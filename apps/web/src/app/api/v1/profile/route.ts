import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { APP_CONFIG } from '@nexeraquest/config';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        trustEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        referredUsers: true,
      },
    });

    if (!user) {
      return jsonError('User profile not found.', 'NOT_FOUND', 404);
    }

    const completedTasksCount = await prisma.taskInstance.count({
      where: { userId: user.id, status: 'APPROVED' },
    });

    const totalTasksCount = await prisma.taskInstance.count({
      where: { userId: user.id },
    });

    const approvalRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 100;

    const referralLink = `${APP_CONFIG.telegramMiniAppUrl}?startapp=ref_${user.referralCode || user.id}`;

    return jsonSuccess({
      profile: {
        id: user.id,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        trustScore: user.trustScore,
        avatarUrl: user.avatarUrl,
        referralCode: user.referralCode,
        referralLink,
        completedQuests: completedTasksCount,
        totalQuests: totalTasksCount,
        approvalRate,
        referralsCount: user.referredUsers.length,
      },
      trustHistory: user.trustEvents,
    });
  } catch (err: any) {
    return jsonError(err.message, 'PROFILE_FETCH_ERROR', 500);
  }
}
