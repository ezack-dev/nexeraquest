import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { VerificationService } from '../services/verificationService.js';
import { TrustService } from '../services/trustService.js';

export const taskRouter = Router();

/**
 * POST /api/tasks/start
 * Starts a task instance for a contributor
 */
taskRouter.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, userId } = req.body;

    if (!campaignId || !userId) {
      res.status(400).json({ error: 'Missing campaignId or userId' });
      return;
    }

    // 1. Check user status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.status === 'FROZEN' || user.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'Your account is frozen due to low trust score or fraud investigation. Contact support.',
      });
      return;
    }

    // 2. Velocity check (anti-bot)
    const velocity = await TrustService.checkVelocity(userId);
    if (!velocity.allowed) {
      res.status(429).json({ error: velocity.reason });
      return;
    }

    // 3. Campaign availability check
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'ACTIVE') {
      res.status(400).json({ error: `Campaign is currently ${campaign.status}` });
      return;
    }

    if (campaign.completedSlots >= campaign.targetSlots) {
      res.status(400).json({ error: 'All reward slots for this campaign have already been claimed!' });
      return;
    }

    // 4. Duplicate prevention: check if user already has an active or approved task
    const existing = await prisma.taskInstance.findFirst({
      where: {
        campaignId,
        userId,
        status: { in: ['STARTED', 'SUBMITTED', 'APPROVED'] },
      },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        res.status(400).json({ error: 'You have already completed this quest and received your reward.' });
        return;
      }
      // Return existing in-progress task instance
      res.json({
        message: 'Task already in progress',
        taskInstance: existing,
      });
      return;
    }

    // 5. Create new TaskInstance
    const taskInstance = await prisma.taskInstance.create({
      data: {
        campaignId,
        userId,
        status: 'STARTED',
      },
      include: {
        campaign: true,
      },
    });

    res.status(201).json({
      message: 'Quest started! Follow the instructions and submit verification.',
      taskInstance,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tasks/:id/verify
 * Initiates automatic verification or submits proof
 */
taskRouter.post('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { payload } = req.body;

    const task = await prisma.taskInstance.findUnique({
      where: { id },
      include: { campaign: true, user: true },
    });

    if (!task || !task.campaign) {
      res.status(404).json({ error: 'Task instance or campaign not found' });
      return;
    }

    if (task.status === 'APPROVED') {
      res.status(400).json({ error: 'Task has already been approved and rewarded.' });
      return;
    }

    if (task.campaign.proofType === 'AUTOMATIC_MEMBERSHIP') {
      const result = await VerificationService.verifyAutomaticTask(
        task.id,
        task.userId,
        task.campaignId
      );
      res.json(result);
    } else {
      if (!payload || !payload.trim()) {
        res.status(400).json({ error: 'Proof payload (link or text) is required.' });
        return;
      }

      const result = await VerificationService.submitManualProof(
        task.id,
        task.userId,
        task.campaignId,
        task.campaign.proofType,
        payload
      );
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tasks/user/:userId
 * Retrieves user's tasks
 */
taskRouter.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const tasks = await prisma.taskInstance.findMany({
      where: { userId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
            rewardPerAction: true,
            proofType: true,
            externalUrl: true,
          },
        },
        proof: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
