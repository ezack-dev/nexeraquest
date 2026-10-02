import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { VerificationEngine } from '@nexeraquest/verification';
import { LedgerEngine } from '@nexeraquest/ledger';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }

    const { id: taskInstanceId } = params;

    const instance = await prisma.taskInstance.findUnique({
      where: { id: taskInstanceId },
      include: {
        task: true,
        campaign: true,
        user: true,
        proof: true,
      },
    });

    if (!instance) {
      return jsonError('Task instance not found.', 'NOT_FOUND', 404);
    }

    if (instance.userId !== session.userId && session.role !== 'SUPER_ADMIN') {
      return jsonError('Forbidden. Task belongs to another user.', 'FORBIDDEN', 403);
    }

    // Campaign pause freezes in-flight verifications — no new approvals
    // unless policy explicitly permits (spec §100).
    if (instance.campaign.status === 'PAUSED') {
      return jsonError(
        'This campaign is paused. Verification is frozen until the campaign resumes.',
        'CAMPAIGN_PAUSED',
        423
      );
    }
    if (['COMPLETED', 'EXPIRED', 'CANCELLED', 'SETTLED'].includes(instance.campaign.status)) {
      return jsonError(
        `This campaign is ${instance.campaign.status.toLowerCase()}. No further verifications are accepted.`,
        'CAMPAIGN_CLOSED',
        422
      );
    }

    // If already approved, return idempotent success
    if (instance.status === 'APPROVED' && instance.rewardClaimed) {
      const balanceAcc = await prisma.balanceAccount.findFirst({
        where: { userId: instance.userId, accountType: 'CONTRIBUTOR', currency: instance.campaign.currency },
      });
      return jsonSuccess({
        verified: true,
        status: 'APPROVED',
        message: 'Task was already verified and rewarded.',
        rewardAmount: instance.campaign.rewardPerAction,
        currency: instance.campaign.currency,
        currentBalance: balanceAcc?.availableBalance || 0,
        alreadyClaimed: true,
      });
    }

    // 1. Execute Modular Verification Adapter (queued when requested async)
    const url = new URL(req.url);
    if (url.searchParams.get('async') === 'true') {
      const { enqueue } = await import('@nexeraquest/queue');
      const { registerJobHandlers } = await import('@/lib/job-handlers');
      registerJobHandlers();
      enqueue('verify-task', { taskInstanceId: instance.id }, { dedupeKey: `verify:${instance.id}` });
      return jsonSuccess({ verified: false, status: 'PENDING', retryable: true, message: 'Verification queued — you will be notified on completion.' });
    }
    const outcome = await VerificationEngine.verifyTaskInstance(instance.id);

    // 2. If VERIFIED, execute transactional Ledger settlement
    if (outcome.status === 'VERIFIED') {
      const idempotencyKey = `rw_task_${instance.id}`;
      const rewardSettlement = await LedgerEngine.creditTaskReward({
        taskInstanceId: instance.id,
        userId: instance.userId,
        campaignId: instance.campaignId,
        rewardAmount: instance.campaign.rewardPerAction,
        idempotencyKey,
      });

      const updatedUser = await prisma.user.findUnique({ where: { id: instance.userId } });

      return jsonSuccess({
        verified: true,
        status: 'APPROVED',
        outcome,
        rewardAmount: instance.campaign.rewardPerAction,
        currency: instance.campaign.currency,
        newBalance: rewardSettlement.newBalance,
        newTrustScore: updatedUser?.trustScore,
        transactionId: rewardSettlement.transactionId,
      });
    }

    // 3. If NOT_VERIFIED or UNAVAILABLE
    return jsonSuccess({
      verified: false,
      status: outcome.status,
      reason: outcome.reason,
      retryable: outcome.retryable ?? true,
    });
  } catch (err: any) {
    return jsonError(err.message, 'VERIFICATION_ERROR', 500);
  }
}
