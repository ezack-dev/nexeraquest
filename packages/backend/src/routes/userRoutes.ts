import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { LedgerService } from '../services/ledgerService.js';

export const userRouter = Router();

/**
 * GET /api/user/profile/:id
 * Full contributor profile, Trust Score, quests, approval rate, referrals
 */
userRouter.get('/profile/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        balanceAccount: true,
        referrals: {
          select: {
            id: true,
            username: true,
            createdAt: true,
            trustScore: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate quest stats & approval rate
    const approvedTasks = await prisma.taskInstance.count({
      where: { userId: id, status: 'APPROVED' },
    });

    const rejectedTasks = await prisma.taskInstance.count({
      where: { userId: id, status: 'REJECTED' },
    });

    const submittedTasks = await prisma.taskInstance.count({
      where: { userId: id, status: 'SUBMITTED' },
    });

    const referralsCount = await prisma.user.count({
      where: { referredById: id },
    });

    const totalDecided = approvedTasks + rejectedTasks;
    const approvalRate = totalDecided > 0 ? Number(((approvedTasks / totalDecided) * 100).toFixed(1)) : 100.0;

    // Fetch recent trust events
    const trustEvents = await prisma.trustEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl ?? null,
        trustScore: user.trustScore,
        status: user.status,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
      stats: {
        completedQuests: approvedTasks,
        pendingReview: submittedTasks,
        rejectedQuests: rejectedTasks,
        approvalRate,
        referralsCount,
      },
      balance: user.balanceAccount,
      recentTrustEvents: trustEvents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/balance/:id
 * Available balance, pending cashouts, settled withdrawals, and ledger events
 */
userRouter.get('/balance/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const balanceAccount = await prisma.balanceAccount.findUnique({
      where: { userId: id },
      include: {
        ledgerEntries: {
          orderBy: { timestamp: 'desc' },
          take: 25,
        },
      },
    });

    if (!balanceAccount) {
      res.status(404).json({ error: 'Balance account not found' });
      return;
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      available: balanceAccount.available,
      pending: balanceAccount.pending,
      withdrawn: balanceAccount.withdrawn,
      totalEarnings: Number((balanceAccount.available + balanceAccount.pending + balanceAccount.withdrawn).toFixed(2)),
      ledgerEntries: balanceAccount.ledgerEntries,
      withdrawals,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/withdraw
 * Initiates non-custodial cash-out request to user wallet
 */
userRouter.post('/withdraw', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, destinationAddress, network } = req.body;

    if (!userId || !amount || !destinationAddress) {
      res.status(400).json({ error: 'Missing required withdrawal fields' });
      return;
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount < 0.5) {
      res.status(400).json({ error: 'Minimum withdrawal amount is 0.50 USDT' });
      return;
    }

    const selectedNet = (network || 'TON').toUpperCase();
    const trimmedAddr = String(destinationAddress).trim();
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    const tonRegex = /^((EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}|0:[a-fA-F0-9]{64})$/;

    if ((selectedNet === 'ARBITRUM' || selectedNet === 'POLYGON') && !evmRegex.test(trimmedAddr)) {
      res.status(400).json({ error: `Invalid ${selectedNet} wallet address. Expected a 42-character 0x... EVM address.` });
      return;
    }

    if (selectedNet === 'TON' && !tonRegex.test(trimmedAddr)) {
      res.status(400).json({ error: 'Invalid TON wallet address. Expected EQ.../UQ... (48 chars) or 0:<hex> format.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { balanceAccount: true },
    });

    if (!user || !user.balanceAccount) {
      res.status(404).json({ error: 'User or balance account not found' });
      return;
    }

    if (user.status === 'FROZEN' || user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account frozen. Withdrawals suspended.' });
      return;
    }

    if (user.balanceAccount.available < payoutAmount) {
      res.status(400).json({
        error: `Insufficient available balance (${user.balanceAccount.available.toFixed(2)} USDT available).`,
      });
      return;
    }

    // 1. Create Withdrawal record in REQUESTED state
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: payoutAmount,
        currency: 'USDT',
        network: selectedNet,
        destinationAddress: trimmedAddr,
        status: 'REQUESTED',
      },
    });

    // 2. Double-entry ledger movement (Available -> Pending)
    await LedgerService.recordWithdrawalRequest(userId, withdrawal.id, payoutAmount);

    res.status(201).json({
      success: true,
      message: `Withdrawal request for ${payoutAmount.toFixed(2)} USDT submitted successfully.`,
      withdrawal,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
