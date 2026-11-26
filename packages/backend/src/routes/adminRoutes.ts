import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { LedgerService } from '../services/ledgerService.js';
import { TrustService } from '../services/trustService.js';

export const adminRouter = Router();

/**
 * GET /api/admin/overview
 * High-level operations KPI metrics
 */
adminRouter.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalCampaigns = await prisma.campaign.count();
    const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } });
    const totalQuestsCompleted = await prisma.taskInstance.count({ where: { status: 'APPROVED' } });
    const pendingProofsCount = await prisma.proof.count({ where: { status: 'PENDING' } });
    const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: 'REQUESTED' } });
    const openFraudCasesCount = await prisma.fraudCase.count({ where: { status: 'OPEN' } });

    const audit = await LedgerService.auditLedger();

    res.json({
      counts: {
        totalUsers,
        totalCampaigns,
        activeCampaigns,
        totalQuestsCompleted,
        pendingProofsCount,
        pendingWithdrawalsCount,
        openFraudCasesCount,
      },
      audit,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/campaigns/pending
 */
adminRouter.get('/campaigns/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/campaigns/:id/review
 */
adminRouter.post('/campaigns/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { action, reason } = req.body; // action: 'APPROVE' | 'REJECT'

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
        rejectionReason: action === 'REJECT' ? reason : null,
      },
    });

    res.json({ success: true, campaign: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/proofs/pending
 */
adminRouter.get('/proofs/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const proofs = await prisma.proof.findMany({
      where: { status: 'PENDING' },
      include: {
        taskInstance: {
          include: {
            user: true,
            campaign: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(proofs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/proofs/:id/decision
 */
adminRouter.post('/proofs/:id/decision', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { decision, reason } = req.body; // decision: 'APPROVE' | 'REJECT'

    const proof = await prisma.proof.findUnique({
      where: { id },
      include: {
        taskInstance: {
          include: { campaign: true, user: true },
        },
      },
    });

    if (!proof || !proof.taskInstance) {
      res.status(404).json({ error: 'Proof or linked task instance record not found' });
      return;
    }

    if (proof.status !== 'PENDING') {
      res.status(400).json({ error: `Proof has already been processed (${proof.status})` });
      return;
    }

    const task = proof.taskInstance;

    if (decision === 'APPROVE') {
      if (task.campaign.completedSlots >= task.campaign.targetSlots) {
        res.status(400).json({ error: 'Campaign has already reached maximum target slots' });
        return;
      }

      // 1. Mark proof as verified
      await prisma.proof.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });

      // 2. Mark task instance as APPROVED
      await prisma.taskInstance.update({
        where: { id: task.id },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      });

      // 3. Increment campaign completedSlots (and complete if full)
      await prisma.campaign.update({
        where: { id: task.campaignId },
        data: {
          completedSlots: { increment: 1 },
          status:
            task.campaign.completedSlots + 1 >= task.campaign.targetSlots
              ? 'COMPLETED'
              : task.campaign.status,
        },
      });

      // 4. Double-entry reward credit
      await LedgerService.recordRewardCredit(
        task.userId,
        task.campaignId,
        task.id,
        task.campaign.rewardPerAction
      );

      // 5. Update Trust Score
      await TrustService.adjustTrustScore(
        task.userId,
        'QUEST_APPROVED',
        2,
        `Manual proof approved for ${task.campaign.title}`
      );

      res.json({ success: true, message: 'Proof approved and reward settled.' });
    } else {
      // REJECT
      await prisma.proof.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason || 'Proof does not satisfy task requirements',
        },
      });

      await prisma.taskInstance.update({
        where: { id: task.id },
        data: {
          status: 'REJECTED',
        },
      });

      // Decrease Trust Score (-10)
      await TrustService.adjustTrustScore(
        task.userId,
        'PROOF_REJECTED',
        -10,
        `Rejected proof: ${reason || 'Incomplete submission'}`
      );

      res.json({ success: true, message: 'Proof rejected.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/withdrawals/pending
 */
adminRouter.get('/withdrawals/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'REQUESTED' },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            trustScore: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(withdrawals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:id/authorize
 * Authorizes payout and records settlement tx hash
 */
adminRouter.post('/withdrawals/:id/authorize', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { txHash, authorizedBy } = req.body;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }

    if (withdrawal.status !== 'REQUESTED') {
      res.status(400).json({ error: `Withdrawal is already in state ${withdrawal.status}` });
      return;
    }

    const generatedTx = txHash || `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;

    // 1. Double-entry ledger settlement (Pending -> Withdrawn)
    await LedgerService.recordWithdrawalSettlement(
      withdrawal.userId,
      withdrawal.id,
      withdrawal.amount,
      generatedTx
    );

    // 2. Update status
    const updated = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        txHash: generatedTx,
        authorizedBy: authorizedBy || 'ADMIN',
        settledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Withdrawal authorized and settled. Transaction Hash: ${generatedTx}`,
      withdrawal: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:id/reject
 */
adminRouter.post('/withdrawals/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }

    if (withdrawal.status !== 'REQUESTED') {
      res.status(400).json({ error: `Withdrawal is already in state ${withdrawal.status}` });
      return;
    }

    // 1. Reverse balance (Pending -> Available)
    await LedgerService.recordWithdrawalReversal(
      withdrawal.userId,
      withdrawal.id,
      withdrawal.amount,
      reason || 'Admin rejected'
    );

    // 2. Mark withdrawal as rejected
    const updated = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Risk check failed',
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal rejected and funds refunded to user available balance.',
      withdrawal: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/fraud/cases
 */
adminRouter.get('/fraud/cases', async (req: Request, res: Response): Promise<void> => {
  try {
    const cases = await prisma.fraudCase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(cases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/fraud/cases/:id/resolve
 */
adminRouter.post('/fraud/cases/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { action, notes } = req.body; // action: 'CLEARED' | 'BANNED'

    const fraudCase = await prisma.fraudCase.findUnique({ where: { id } });
    if (!fraudCase) {
      res.status(404).json({ error: 'Fraud case not found' });
      return;
    }

    if (action === 'BANNED' && fraudCase.subjectType === 'USER') {
      await prisma.user.update({
        where: { id: fraudCase.subjectId },
        data: { status: 'SUSPENDED' },
      });
    } else if (action === 'CLEARED' && fraudCase.subjectType === 'USER') {
      await prisma.user.update({
        where: { id: fraudCase.subjectId },
        data: { status: 'ACTIVE' },
      });
    }

    const updated = await prisma.fraudCase.update({
      where: { id },
      data: {
        status: action === 'BANNED' ? 'RESOLVED_BANNED' : 'RESOLVED_CLEARED',
        notes: notes || `Resolved as ${action}`,
      },
    });

    res.json({ success: true, fraudCase: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/ledger/audit
 */
adminRouter.get('/ledger/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const audit = await LedgerService.auditLedger();
    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
