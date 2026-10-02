import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const project = await prisma.project.findFirst({
      include: {
        campaigns: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      return jsonError('No project found in database.', 'NOT_FOUND', 404);
    }

    const campaigns = project.campaigns;
    const activeCampaigns = campaigns.filter((c) => c.status === 'LIVE').length;
    const totalBudget = campaigns.reduce((acc, c) => acc + c.totalBudget, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.earnedBudget, 0);
    const totalLocked = campaigns.reduce((acc, c) => acc + c.lockedBudget, 0);
    const totalVerifiedActions = campaigns.reduce((acc, c) => acc + c.completedParticipants, 0);

    // Funnel Telemetry Calculation
    const allCampaignIds = campaigns.map((c) => c.id);
    const startedTasks = await prisma.taskInstance.count({
      where: { campaignId: { in: allCampaignIds } },
    });
    const submittedProofs = await prisma.proof.count({
      where: { taskInstance: { campaignId: { in: allCampaignIds } } },
    });
    const verifiedTasks = await prisma.taskInstance.count({
      where: { campaignId: { in: allCampaignIds }, status: 'APPROVED' },
    });

    const rejectedTasks = await prisma.taskInstance.count({
      where: { campaignId: { in: allCampaignIds }, status: 'REJECTED' },
    });
    const disputedTasks = await prisma.taskInstance.count({
      where: { campaignId: { in: allCampaignIds }, status: 'DISPUTED' },
    });
    const fraudSignals = await prisma.fraudSignal.count({
      where: { userId: { in: (await prisma.taskInstance.findMany({ where: { campaignId: { in: allCampaignIds } }, select: { userId: true }, distinct: ['userId'] })).map((t) => t.userId) } },
    }).catch(() => 0);

    const funnel = {
      started: startedTasks,
      submitted: submittedProofs,
      verified: verifiedTasks,
      rejected: rejectedTasks,
      disputed: disputedTasks,
      rewarded: verifiedTasks,
    };

    // Real derived metrics — no invented numbers
    const judged = verifiedTasks + rejectedTasks;
    const approvalRate = judged > 0 ? (verifiedTasks / judged) * 100 : null;
    const costPerVerified = verifiedTasks > 0 ? totalSpent / verifiedTasks : null;
    const verifyAttempts = await prisma.verificationAttempt.findMany({
      where: { taskInstance: { campaignId: { in: allCampaignIds } } },
      select: { verifiedAt: true, taskInstanceId: true },
    }).catch(() => []);
    const metrics = {
      approvalRate,
      costPerVerified,
      fraudSignals,
      totalStarted: startedTasks,
      totalSubmitted: submittedProofs,
      totalRejected: rejectedTasks,
      totalDisputed: disputedTasks,
    };

    // Recent completions
    const recentCompletions = await prisma.taskInstance.findMany({
      where: { campaignId: { in: allCampaignIds } },
      orderBy: { startedAt: 'desc' },
      take: 8,
      include: {
        task: true,
        user: {
          select: {
            id: true,
            telegramUsername: true,
            firstName: true,
            trustScore: true,
          },
        },
      },
    });

    return jsonSuccess({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        website: project.website,
        twitterUrl: project.twitterUrl,
        telegramUrl: project.telegramUrl,
        verificationStatus: project.verificationStatus,
        logoUrl: project.logoUrl,
        bannerUrl: project.bannerUrl,
      },
      stats: {
        activeCampaigns,
        totalCampaigns: campaigns.length,
        totalBudget,
        totalSpent,
        totalLocked,
        totalVerifiedActions,
      },
      funnel,
      metrics,
      campaigns,
      recentCompletions,
    });
  } catch (err: any) {
    return jsonError(err.message, 'PROJECT_OVERVIEW_ERROR', 500);
  }
}
