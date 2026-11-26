import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { LedgerService } from '../services/ledgerService.js';

export const campaignRouter = Router();

/**
 * GET /api/campaigns
 * Lists public active campaigns with filters
 */
campaignRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, minReward, status, projectId } = req.query;

    const where: any = {};

    if (status !== 'ALL') {
      where.status = (status as string) || 'ACTIVE';
    }

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    if (minReward) {
      where.rewardPerAction = { gte: parseFloat(minReward as string) };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            website: true,
            telegramChannel: true,
            twitterHandle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campaigns/projects/list
 * Lists registered Web3 project sponsors for the Project Portal
 */
campaignRouter.get('/projects/list', async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campaigns/:id
 * Retrieves campaign detail with task instances count
 */
campaignRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        project: true,
        _count: {
          select: { taskInstances: true },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns
 * Project sponsor creates a new campaign
 */
campaignRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      taskType,
      instructions,
      externalUrl,
      rewardPerAction,
      targetSlots,
      proofType,
    } = req.body;

    if (!projectId || !title || !rewardPerAction || !targetSlots) {
      res.status(400).json({ error: 'Missing required campaign parameters' });
      return;
    }

    const reward = parseFloat(rewardPerAction);
    const slots = parseInt(targetSlots, 10);
    const rewardPool = Number((reward * slots).toFixed(2));
    const platformFee = Number((rewardPool * 0.20).toFixed(2)); // Canonical 20% platform fee
    const totalCost = Number((rewardPool + platformFee).toFixed(2));

    const campaign = await prisma.campaign.create({
      data: {
        projectId,
        title,
        description: description || '',
        category: category || 'COMMUNITY',
        taskType: taskType || 'TELEGRAM_JOIN',
        instructions: instructions || '',
        externalUrl: externalUrl || null,
        rewardPerAction: reward,
        targetSlots: slots,
        rewardPool,
        platformFee,
        totalCost,
        proofType: proofType || 'AUTOMATIC_MEMBERSHIP',
        status: 'PENDING_REVIEW', // Created, awaiting escrow funding & admin approval
      },
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/fund
 * Locks escrow funds and marks campaign as funded
 */
campaignRouter.post('/:id/fund', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { depositRef } = req.body;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // 1. Record double-entry escrow deposit
    await LedgerService.recordCampaignDeposit(
      campaign.id,
      campaign.rewardPool,
      campaign.platformFee,
      depositRef || 'SIMULATED_ESCROW_TX'
    );

    // 2. Set campaign state to ACTIVE (or PENDING_REVIEW if strict admin approval is enabled)
    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    res.json({
      success: true,
      message: `Escrow funded! ${campaign.rewardPool} USDT locked for rewards, ${campaign.platformFee} USDT platform fee recorded.`,
      campaign: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campaigns/:id/telemetry
 * Real-time campaign statistics for project dashboard
 */
campaignRouter.get('/:id/telemetry', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const completedSlots = campaign.completedSlots;
    const remainingSlots = Math.max(0, campaign.targetSlots - completedSlots);
    const spentBudget = Number((completedSlots * campaign.rewardPerAction).toFixed(2));
    const remainingBudget = Number((remainingSlots * campaign.rewardPerAction).toFixed(2));
    const completionRate = Number(((completedSlots / campaign.targetSlots) * 100).toFixed(1));

    // Get verified attempts breakdown
    const approvedCount = await prisma.taskInstance.count({
      where: { campaignId: id, status: 'APPROVED' },
    });
    const pendingCount = await prisma.taskInstance.count({
      where: { campaignId: id, status: 'SUBMITTED' },
    });
    const rejectedCount = await prisma.taskInstance.count({
      where: { campaignId: id, status: 'REJECTED' },
    });
    const totalStarted = await prisma.taskInstance.count({
      where: { campaignId: id },
    });

    res.json({
      campaignId: id,
      title: campaign.title,
      status: campaign.status,
      targetSlots: campaign.targetSlots,
      completedSlots,
      remainingSlots,
      rewardPerAction: campaign.rewardPerAction,
      rewardPool: campaign.rewardPool,
      spentBudget,
      remainingBudget,
      completionRate,
      breakdown: {
        approved: approvedCount,
        pendingReview: pendingCount,
        rejected: rejectedCount,
        totalStarted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campaigns/:id/export
 * Exports verified participants for project sponsors
 */
campaignRouter.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const tasks = await prisma.taskInstance.findMany({
      where: {
        campaignId: id,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            telegramId: true,
            username: true,
            trustScore: true,
          },
        },
        proof: true,
      },
      orderBy: { completedAt: 'asc' },
    });

    const exportData = tasks.map((t, idx) => ({
      index: idx + 1,
      telegramId: t.user.telegramId,
      username: t.user.username ? `@${t.user.username}` : 'N/A',
      trustScore: t.user.trustScore,
      completedAt: t.completedAt?.toISOString(),
      proofPayload: t.proof?.payload || 'N/A',
    }));

    res.json({
      campaignId: id,
      totalVerified: exportData.length,
      participants: exportData,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/close
 * Closes campaign and refunds unclaimed escrow to project
 */
campaignRouter.post('/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status === 'CLOSED') {
      res.status(400).json({ error: 'Campaign is already closed' });
      return;
    }

    const unclaimedSlots = Math.max(0, campaign.targetSlots - campaign.completedSlots);
    const refundAmount = Number((unclaimedSlots * campaign.rewardPerAction).toFixed(2));

    if (refundAmount > 0) {
      await LedgerService.recordCampaignRefund(campaign.id, refundAmount);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    res.json({
      success: true,
      message: `Campaign closed. ${refundAmount.toFixed(2)} USDT (${unclaimedSlots} unclaimed slots) refunded to project account.`,
      campaign: updated,
      refundAmount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
