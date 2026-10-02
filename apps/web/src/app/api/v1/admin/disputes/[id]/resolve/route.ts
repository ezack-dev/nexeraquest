import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { LedgerEngine } from '@nexeraquest/ledger';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'dispute:resolve');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const { id: disputeId } = params;
    const body = await req.json();
    const { decision, notes } = body; // UPHELD, OVERTURNED, REJECTED

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        taskInstance: {
          include: { task: true, campaign: true },
        },
      },
    });

    if (!dispute) {
      return jsonError('Dispute not found.', 'NOT_FOUND', 404);
    }

    // If Overturned, award the full reward to the contributor.
    if (decision === 'OVERTURNED' && !dispute.taskInstance.rewardClaimed) {
      const idempotencyKey = `dispute_overturn_${dispute.id}`;
      await LedgerEngine.creditTaskReward({
        taskInstanceId: dispute.taskInstanceId,
        userId: dispute.userId,
        campaignId: dispute.taskInstance.campaignId,
        rewardAmount: dispute.taskInstance.campaign.rewardPerAction,
        idempotencyKey,
      });
    }

    // Partial adjustment: credit a custom amount without re-running
    // verification. Amount must be > 0 and <= full reward.
    if (decision === 'PARTIAL_ADJUSTMENT') {
      const partialAmount = Number(body.partialAmount);
      const fullReward = dispute.taskInstance.campaign.rewardPerAction;
      if (!partialAmount || partialAmount <= 0 || partialAmount > fullReward) {
        return jsonError(
          `Partial amount must be between 0 and the full reward (${fullReward}).`,
          'INVALID_PARTIAL_AMOUNT',
          400
        );
      }
      if (dispute.taskInstance.rewardClaimed) {
        return jsonError('Reward already claimed — cannot apply partial adjustment.', 'ALREADY_CLAIMED', 409);
      }
      await LedgerEngine.creditTaskReward({
        taskInstanceId: dispute.taskInstanceId,
        userId: dispute.userId,
        campaignId: dispute.taskInstance.campaignId,
        rewardAmount: partialAmount,
        idempotencyKey: `dispute_partial_${dispute.id}`,
      });
    }

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: decision,
        adminDecision: decision,
        adminNotes: notes,
        resolvedBy: session?.userId || 'ADMIN',
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: session?.userId || 'ADMIN',
        actorRole: session?.role || 'SUPER_ADMIN',
        action: `DISPUTE_${decision}`,
        entityType: 'DISPUTE',
        entityId: dispute.id,
        metadata: JSON.stringify({ notes }),
      },
    });

    return jsonSuccess({ dispute: updated });
  } catch (err: any) {
    return jsonError(err.message, 'DISPUTE_RESOLVE_ERROR', 500);
  }
}
