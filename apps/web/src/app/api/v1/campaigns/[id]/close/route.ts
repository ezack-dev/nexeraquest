import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { NotificationDispatcher } from '@nexeraquest/notifications';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

const CLOSEABLE = ['LIVE', 'PAUSED', 'SCHEDULED', 'APPROVED'];

/**
 * Project-initiated campaign closure. Moves to COMPLETED (reconciles
 * outstanding tasks) and notifies affected contributors. Refund is a
 * separate explicit step via /refund so earned liabilities are never
 * mixed with refundable funds.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'campaign:refund');
  if ('error' in auth) return auth.error;
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { _count: { select: { taskInstances: true } } },
    });
    if (!campaign) return jsonError('Campaign not found.', 'NOT_FOUND', 404);

    if (auth.session.projectId && auth.session.projectId !== campaign.projectId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: campaign.projectId, userId: auth.session.userId } },
      });
      if (!membership) return jsonError('Forbidden: not a member of this project.', 'FORBIDDEN', 403);
    }

    if (!CLOSEABLE.includes(campaign.status)) {
      return jsonError(`Campaign cannot be closed from ${campaign.status}.`, 'INVALID_STATE', 422);
    }

    const body = await req.json().catch(() => ({}));
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED', pausedReason: body.reason || campaign.pausedReason },
    });

    // Freeze any still-pending verification attempts
    await prisma.verificationAttempt.updateMany({
      where: { taskInstance: { campaignId: campaign.id }, status: 'PENDING' },
      data: { status: 'UNAVAILABLE', errorReason: 'Campaign closed by project' },
    });

    const affected = await prisma.taskInstance.findMany({
      where: { campaignId: campaign.id, status: { in: ['IN_PROGRESS', 'SUBMISSION_REQUIRED'] } },
      select: { userId: true },
    });
    const uniqueUsers = [...new Set(affected.map((t) => t.userId))];
    if (uniqueUsers.length) {
      await NotificationDispatcher.broadcast(uniqueUsers, {
        templateKey: 'CAMPAIGN_CLOSED',
        title: `Campaign closed: ${campaign.title}`,
        messageBody: 'This campaign has ended. Pending submissions will no longer be verified.',
        deepLinkRoute: 'quests',
      });
    }

    await prisma.auditEvent.create({
      data: {
        actorId: auth.session.userId,
        actorRole: auth.session.role,
        action: 'CAMPAIGN_CLOSE',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        previousState: JSON.stringify({ status: campaign.status }),
        newState: JSON.stringify({ status: 'COMPLETED' }),
        metadata: JSON.stringify({ reason: body.reason || null, affectedUsers: uniqueUsers.length }),
      },
    });

    const fresh = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    return jsonSuccess({
      campaign: updated,
      refundable: fresh?.lockedBudget || 0,
      earned: fresh?.earnedBudget || 0,
      affectedUsers: uniqueUsers.length,
    });
  } catch (err: any) {
    return jsonError(err.message, 'CLOSE_FAILED', 500);
  }
}
