import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'audit:read');
  if ('error' in auth) return auth.error;
  try {
    const totalUsers = await prisma.user.count();
    const activeContributors = await prisma.user.count({ where: { role: 'CONTRIBUTOR', status: 'ACTIVE' } });
    const totalProjects = await prisma.project.count();
    const totalCampaigns = await prisma.campaign.count();
    const liveCampaigns = await prisma.campaign.count({ where: { status: 'LIVE' } });
    const pendingApprovals = await prisma.campaign.count({ where: { status: 'UNDER_REVIEW' } });
    const openFraudCases = await prisma.fraudCase.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } });
    const pendingDisputes = await prisma.dispute.count({ where: { status: 'UNDER_REVIEW' } });
    const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: { in: ['PENDING_AUTHORIZATION', 'RISK_CHECK'] } } });

    // Financial balances
    const allCampaigns = await prisma.campaign.findMany({ select: { totalBudget: true, lockedBudget: true, earnedBudget: true } });
    const totalFunded = allCampaigns.reduce((acc, c) => acc + c.totalBudget, 0);
    const totalEscrowLocked = allCampaigns.reduce((acc, c) => acc + c.lockedBudget, 0);
    const totalRewardLiabilitiesSettled = allCampaigns.reduce((acc, c) => acc + c.earnedBudget, 0);

    const platformFeeAcc = await prisma.balanceAccount.findFirst({
      where: { accountType: 'PLATFORM_FEE' },
    });

    const latestReconciliation = await prisma.reconciliationRun.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // Recent Audit Logs
    const recentAuditLogs = await prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    return jsonSuccess({
      kpis: {
        totalUsers,
        activeContributors,
        totalProjects,
        totalCampaigns,
        liveCampaigns,
        pendingApprovals,
        openFraudCases,
        pendingDisputes,
        pendingWithdrawals,
        totalFunded,
        totalEscrowLocked,
        totalRewardLiabilitiesSettled,
        platformFeeRevenue: platformFeeAcc?.availableBalance || 0,
      },
      latestReconciliation,
      recentAuditLogs,
    });
  } catch (err: any) {
    return jsonError(err.message, 'ADMIN_OVERVIEW_ERROR', 500);
  }
}
