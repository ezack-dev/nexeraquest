import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { LedgerEngine } from '@nexeraquest/ledger';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(req);
    const { id: campaignId } = params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return jsonError(`Campaign "${campaignId}" not found.`, 'NOT_FOUND', 404);
    }

    const rewardPool = campaign.rewardPerAction * campaign.targetParticipants;
    const platformFee = campaign.platformFee;
    const totalDeposit = rewardPool + platformFee;
    const idempotencyKey = `fund_${campaign.id}_${Date.now()}`;

    const result = await LedgerEngine.lockCampaignEscrow(
      campaign.id,
      campaign.projectId,
      totalDeposit,
      rewardPool,
      platformFee,
      idempotencyKey
    );

    // In sandbox or auto-launch mode, automatically advance to LIVE
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'LIVE' },
      include: { tasks: true, project: true },
    });

    // Record audit
    await prisma.auditEvent.create({
      data: {
        actorId: session?.userId || 'SYSTEM',
        actorRole: session?.role || 'PROJECT_OWNER',
        action: 'CAMPAIGN_FUNDED_AND_LAUNCHED',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        metadata: JSON.stringify({ totalDeposit, rewardPool, platformFee }),
      },
    });

    return jsonSuccess({ campaign: updated, escrow: result });
  } catch (err: any) {
    return jsonError(err.message, 'FUNDING_ERROR', 500);
  }
}
