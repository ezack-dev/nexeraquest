import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { LedgerEngine } from '@nexeraquest/ledger';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'campaign:refund');
  if ('error' in auth) return auth.error;
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return jsonError('Campaign not found.', 'NOT_FOUND', 404);

    // Only the owning project's team can refund this campaign
    if (auth.session.projectId && auth.session.projectId !== campaign.projectId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: campaign.projectId, userId: auth.session.userId } },
      });
      if (!membership) return jsonError('Forbidden: not a member of this project.', 'FORBIDDEN', 403);
    }

    if (!['COMPLETED', 'EXPIRED', 'CANCELLED', 'PAUSED'].includes(campaign.status)) {
      return jsonError(
        `Refunds are only available once a campaign is completed, expired, or cancelled (current: ${campaign.status}).`,
        'INVALID_STATE',
        422
      );
    }

    const result = await LedgerEngine.settleCampaignRefund(campaign.id, auth.session.userId);

    await prisma.auditEvent.create({
      data: {
        actorId: auth.session.userId,
        actorRole: auth.session.role,
        action: 'CAMPAIGN_REFUND',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        previousState: JSON.stringify({ lockedBudget: campaign.lockedBudget, status: campaign.status }),
        newState: JSON.stringify({ refundedAmount: result.refundedAmount }),
      },
    });

    return jsonSuccess(result);
  } catch (err: any) {
    return jsonError(err.message, 'REFUND_FAILED', 500);
  }
}
