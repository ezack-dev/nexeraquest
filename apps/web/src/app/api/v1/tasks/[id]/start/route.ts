import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { RATE_LIMITS } from '@nexeraquest/auth/src/ratelimit';
import { jsonSuccess, jsonError, getAuthSession, enforceRateLimit } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized. Please authenticate via Telegram.', 'UNAUTHORIZED', 401);
    }
    const limited = enforceRateLimit(req, session.userId, 'task-start', RATE_LIMITS.taskStart);
    if (limited) return limited;

    const { id: campaignTaskId } = params;

    const task = await prisma.campaignTask.findUnique({
      where: { id: campaignTaskId },
      include: { campaign: true },
    });

    if (!task) {
      return jsonError('Task not found.', 'NOT_FOUND', 404);
    }

    if (task.campaign.status !== 'LIVE') {
      return jsonError(`Campaign is not active (Status: ${task.campaign.status}).`, 'CAMPAIGN_NOT_LIVE', 400);
    }

    // Check Eligibility: Min Trust Score
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return jsonError('User profile not found.', 'NOT_FOUND', 404);
    }

    let minScore = 0;
    if (task.campaign.eligibilityConfig) {
      try {
        const config = JSON.parse(task.campaign.eligibilityConfig);
        if (config.minTrustScore) minScore = config.minTrustScore;
      } catch {
        // ignore
      }
    }

    if (user.trustScore < minScore) {
      return jsonError(
        `This campaign requires a minimum Trust Score of ${minScore}. Your score is currently ${user.trustScore}. Complete other basic quests to improve your reputation!`,
        'INSUFFICIENT_TRUST_SCORE',
        403
      );
    }

    // Check if task instance already exists (Idempotent start)
    let instance = await prisma.taskInstance.findUnique({
      where: {
        campaignTaskId_userId: {
          campaignTaskId: task.id,
          userId: user.id,
        },
      },
      include: { task: true, proof: true },
    });

    if (!instance) {
      const timerSec = task.timerSeconds || 900;
      const expiresAt = new Date(Date.now() + timerSec * 1000);

      instance = await prisma.taskInstance.create({
        data: {
          campaignTaskId: task.id,
          campaignId: task.campaignId,
          userId: user.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          expiresAt,
        },
        include: { task: true, proof: true },
      });
    }

    return jsonSuccess(instance);
  } catch (err: any) {
    return jsonError(err.message, 'TASK_START_ERROR', 500);
  }
}
