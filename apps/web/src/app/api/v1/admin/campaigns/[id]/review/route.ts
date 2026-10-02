import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'campaign:approve');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const { id: campaignId } = params;
    const body = await req.json();
    const { action, reason } = body; // APPROVE, REJECT, REQUEST_CHANGES, PAUSE

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return jsonError('Campaign not found.', 'NOT_FOUND', 404);
    }

    let newStatus = campaign.status;
    if (action === 'APPROVE') {
      newStatus = 'LIVE';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'REQUEST_CHANGES') {
      newStatus = 'DRAFT';
    } else if (action === 'PAUSE') {
      newStatus = 'PAUSED';
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: newStatus,
        pausedReason: action === 'PAUSE' ? reason : campaign.pausedReason,
        rejectionReason: action === 'REJECT' ? reason : campaign.rejectionReason,
      },
    });

    // Pause side-effects: freeze in-flight verifications so no new
    // approvals slip through while paused (spec §100).
    if (action === 'PAUSE') {
      await prisma.verificationAttempt.updateMany({
        where: {
          taskInstance: { campaignId },
          status: 'PENDING',
        },
        data: { status: 'UNAVAILABLE', errorReason: `Campaign paused: ${reason || 'operator action'}` },
      });
      const { NotificationDispatcher } = await import('@nexeraquest/notifications');
      const affected = await prisma.taskInstance.findMany({
        where: { campaignId, status: { in: ['IN_PROGRESS', 'SUBMISSION_REQUIRED'] } },
        select: { userId: true },
      });
      const uniqueUsers = Array.from(new Set(affected.map((t) => t.userId)));
      await NotificationDispatcher.broadcast(uniqueUsers, {
        templateKey: 'CAMPAIGN_PAUSED',
        title: `Campaign paused: ${campaign.title}`,
        messageBody: reason || 'The campaign is temporarily paused. Your progress is saved.',
        deepLinkRoute: 'explore',
      });
    }

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        actorId: session?.userId || 'ADMIN',
        actorRole: session?.role || 'SUPER_ADMIN',
        action: `CAMPAIGN_${action}`,
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        previousState: JSON.stringify({ status: campaign.status }),
        newState: JSON.stringify({ status: newStatus }),
        metadata: JSON.stringify({ reason }),
      },
    });

    return jsonSuccess({ campaign: updated });
  } catch (err: any) {
    return jsonError(err.message, 'REVIEW_FAILED', 500);
  }
}
