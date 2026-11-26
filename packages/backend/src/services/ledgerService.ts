import { prisma } from '../prisma.js';

export class LedgerService {
  /**
   * Records project escrow deposit:
   * 1. Credits campaign reward pool to campaign escrow
   * 2. Credits platform fee to platform revenue account
   */
  static async recordCampaignDeposit(
    campaignId: string,
    rewardPool: number,
    platformFee: number,
    projectWalletOrRef?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Credit campaign reward pool escrow
      const rewardEntry = await tx.ledgerEntry.create({
        data: {
          campaignId,
          type: 'CAMPAIGN_DEPOSIT',
          direction: 'CREDIT',
          amount: rewardPool,
          currency: 'USDT',
          referenceId: projectWalletOrRef || 'MANUAL_DEPOSIT',
          description: `Pre-funded reward pool for campaign ${campaignId}`,
        },
      });

      // 2. Credit platform fee revenue
      const feeEntry = await tx.ledgerEntry.create({
        data: {
          campaignId,
          type: 'PLATFORM_FEE',
          direction: 'CREDIT',
          amount: platformFee,
          currency: 'USDT',
          referenceId: projectWalletOrRef || 'MANUAL_DEPOSIT',
          description: `Platform verification fee (20%) for campaign ${campaignId}`,
        },
      });

      return { rewardEntry, feeEntry };
    });
  }

  /**
   * Records verified contributor reward credit:
   * 1. Debits campaign escrow
   * 2. Credits contributor available balance
   * 3. Prevents duplicate credit via unique reference check
   */
  static async recordRewardCredit(
    userId: string,
    campaignId: string,
    taskInstanceId: string,
    rewardAmount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // Check idempotency: Ensure this task hasn't already been credited
      const existingCredit = await tx.ledgerEntry.findFirst({
        where: {
          referenceId: `task_${taskInstanceId}`,
          type: 'REWARD_EARNED',
        },
      });

      if (existingCredit) {
        throw new Error(`Reward for task instance ${taskInstanceId} has already been credited.`);
      }

      // Ensure user balance account exists
      let balanceAccount = await tx.balanceAccount.findUnique({
        where: { userId },
      });

      if (!balanceAccount) {
        balanceAccount = await tx.balanceAccount.create({
          data: {
            userId,
            available: 0,
            pending: 0,
            withdrawn: 0,
          },
        });
      }

      // 1. Debit campaign escrow entry
      await tx.ledgerEntry.create({
        data: {
          campaignId,
          type: 'REWARD_EARNED',
          direction: 'DEBIT',
          amount: rewardAmount,
          currency: 'USDT',
          referenceId: `task_${taskInstanceId}`,
          description: `Escrow debit for verified task by user ${userId}`,
        },
      });

      // 2. Credit contributor balance entry
      const creditEntry = await tx.ledgerEntry.create({
        data: {
          accountId: balanceAccount.id,
          campaignId,
          type: 'REWARD_EARNED',
          direction: 'CREDIT',
          amount: rewardAmount,
          currency: 'USDT',
          referenceId: `task_${taskInstanceId}`,
          description: `Verified quest reward for campaign ${campaignId}`,
        },
      });

      // 3. Increment contributor available balance
      const updatedAccount = await tx.balanceAccount.update({
        where: { id: balanceAccount.id },
        data: {
          available: { increment: rewardAmount },
        },
      });

      return { creditEntry, updatedAccount };
    });
  }

  /**
   * Moves available balance to pending during withdrawal request
   */
  static async recordWithdrawalRequest(
    userId: string,
    withdrawalId: string,
    amount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.balanceAccount.findUnique({
        where: { userId },
      });

      if (!account || account.available < amount) {
        throw new Error('Insufficient available balance for withdrawal.');
      }

      // Update balances
      const updatedAccount = await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          available: { decrement: amount },
          pending: { increment: amount },
        },
      });

      // Ledger audit entry
      const entry = await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          type: 'WITHDRAWAL_REQUESTED',
          direction: 'DEBIT',
          amount,
          currency: 'USDT',
          referenceId: `withdrawal_${withdrawalId}`,
          description: `Funds reserved for pending withdrawal ${withdrawalId}`,
        },
      });

      return { entry, updatedAccount };
    });
  }

  /**
   * Finalizes withdrawal settlement after on-chain transaction
   */
  static async recordWithdrawalSettlement(
    userId: string,
    withdrawalId: string,
    amount: number,
    txHash: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.balanceAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error(`Account not found for user ${userId}`);
      }

      const updatedAccount = await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          pending: { decrement: amount },
          withdrawn: { increment: amount },
        },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          type: 'WITHDRAWAL_SETTLED',
          direction: 'DEBIT',
          amount,
          currency: 'USDT',
          referenceId: `withdrawal_${withdrawalId}`,
          description: `On-chain payout settled: txHash ${txHash}`,
        },
      });

      return { entry, updatedAccount };
    });
  }

  /**
   * Reverses withdrawal request on rejection/failure
   */
  static async recordWithdrawalReversal(
    userId: string,
    withdrawalId: string,
    amount: number,
    reason: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.balanceAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new Error(`Account not found for user ${userId}`);
      }

      const updatedAccount = await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          pending: { decrement: amount },
          available: { increment: amount },
        },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          type: 'REWARD_REVERSED',
          direction: 'CREDIT',
          amount,
          currency: 'USDT',
          referenceId: `withdrawal_${withdrawalId}`,
          description: `Withdrawal rejected: ${reason}. Funds returned to available balance.`,
        },
      });

      return { entry, updatedAccount };
    });
  }

  /**
   * Unclaimed campaign slot refund
   */
  static async recordCampaignRefund(campaignId: string, refundAmount: number) {
    return await prisma.$transaction(async (tx) => {
      const existingRefund = await tx.ledgerEntry.findFirst({
        where: { campaignId, type: 'CAMPAIGN_REFUND' },
      });
      if (existingRefund) {
        throw new Error(`Refund for campaign ${campaignId} has already been processed.`);
      }

      return await tx.ledgerEntry.create({
        data: {
          campaignId,
          type: 'CAMPAIGN_REFUND',
          direction: 'DEBIT',
          amount: refundAmount,
          currency: 'USDT',
          referenceId: `refund_${campaignId}`,
          description: `Refund of unclaimed escrow balance upon campaign closure.`,
        },
      });
    });
  }

  /**
   * Platform-wide financial reconciliation audit
   */
  static async auditLedger() {
    const entries = await prisma.ledgerEntry.findMany();

    let totalDeposits = 0;
    let totalPlatformFees = 0;
    let totalRewardsEarned = 0;
    let totalWithdrawalsRequested = 0;
    let totalWithdrawalsSettled = 0;
    let totalRefunds = 0;

    const fundedCampaignIds = new Set<string>();

    for (const e of entries) {
      if (e.type === 'CAMPAIGN_DEPOSIT') {
        totalDeposits += e.amount;
        if (e.campaignId) fundedCampaignIds.add(e.campaignId);
      } else if (e.type === 'PLATFORM_FEE') totalPlatformFees += e.amount;
      else if (e.type === 'REWARD_EARNED' && e.direction === 'CREDIT') totalRewardsEarned += e.amount;
      else if (e.type === 'WITHDRAWAL_REQUESTED') totalWithdrawalsRequested += e.amount;
      else if (e.type === 'WITHDRAWAL_SETTLED') totalWithdrawalsSettled += e.amount;
      else if (e.type === 'CAMPAIGN_REFUND') totalRefunds += e.amount;
    }

    const accounts = await prisma.balanceAccount.findMany();
    const totalAvailableLiability = accounts.reduce((sum, a) => sum + a.available, 0);
    const totalPendingLiability = accounts.reduce((sum, a) => sum + a.pending, 0);
    const totalWithdrawnRecorded = accounts.reduce((sum, a) => sum + a.withdrawn, 0);

    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        id: { in: Array.from(fundedCampaignIds) },
        status: { in: ['ACTIVE', 'PAUSED', 'PENDING_REVIEW'] },
      },
    });

    const totalCampaignEscrowLiability = activeCampaigns.reduce(
      (sum, c) => sum + Math.max(0, (c.targetSlots - c.completedSlots) * c.rewardPerAction),
      0
    );

    const escrowBalanced =
      Math.abs(totalDeposits - (totalRewardsEarned + totalCampaignEscrowLiability + totalRefunds)) < 0.01;
    const walletBalanced =
      Math.abs(
        totalRewardsEarned - (totalAvailableLiability + totalPendingLiability + totalWithdrawnRecorded)
      ) < 0.01;

    const isBalanced = escrowBalanced && walletBalanced;

    return {
      totalDeposits,
      totalPlatformFees,
      totalRewardsEarned,
      totalWithdrawalsSettled,
      totalRefunds,
      totalAvailableLiability,
      totalPendingLiability,
      totalWithdrawnRecorded,
      totalCampaignEscrowLiability,
      escrowBalanced,
      walletBalanced,
      isBalanced,
      totalEntriesCount: entries.length,
    };
  }
}
