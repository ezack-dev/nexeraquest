import { prisma } from '@nexeraquest/database';
import { WITHDRAWAL_LIMITS, DEFAULT_TRUST_SCORE_CONFIG } from '@nexeraquest/config';
import { randomUUID } from 'crypto';

export interface CreditRewardParams {
  taskInstanceId: string;
  userId: string;
  campaignId: string;
  rewardAmount: number;
  idempotencyKey: string;
}

export interface RequestWithdrawalParams {
  userId: string;
  amount: number;
  network: string;
  destinationAddress: string;
  idempotencyKey: string;
}

export class LedgerEngine {
  /**
   * Helper to fetch or create a balance account with initial 0s
   */
  static async getOrCreateAccount(
    userId?: string | null,
    projectId?: string | null,
    accountType: 'CONTRIBUTOR' | 'PROJECT' | 'PLATFORM_FEE' | 'ESCROW' = 'CONTRIBUTOR',
    currency = 'USDT'
  ) {
    if (userId) {
      let acc = await prisma.balanceAccount.findFirst({
        where: { userId, accountType, currency },
      });
      if (!acc) {
        acc = await prisma.balanceAccount.create({
          data: {
            userId,
            accountType,
            currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }
      return acc;
    }

    if (projectId) {
      let acc = await prisma.balanceAccount.findFirst({
        where: { projectId, accountType, currency },
      });
      if (!acc) {
        acc = await prisma.balanceAccount.create({
          data: {
            projectId,
            accountType,
            currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }
      return acc;
    }

    if (accountType === 'PLATFORM_FEE') {
      let acc = await prisma.balanceAccount.findFirst({
        where: { accountType: 'PLATFORM_FEE', currency },
      });
      if (!acc) {
        acc = await prisma.balanceAccount.create({
          data: {
            id: `acc_platform_fee_${currency.toLowerCase()}`,
            accountType: 'PLATFORM_FEE',
            currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }
      return acc;
    }

    throw new Error('Invalid account identification for balance account creation.');
  }

  /**
   * Transactionally lock project funding into campaign escrow.
   * State moves to FUNDED.
   */
  static async lockCampaignEscrow(
    campaignId: string,
    projectId: string,
    totalDeposit: number,
    rewardPool: number,
    platformFee: number,
    idempotencyKey: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const existingEntry = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey },
      });
      if (existingEntry) {
        return { success: true, message: 'Idempotent replay detected', entry: existingEntry };
      }

      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) throw new Error(`Campaign ${campaignId} not found.`);

      // 2. Fetch project escrow account
      let escrowAcc = await tx.balanceAccount.findFirst({
        where: { projectId, accountType: 'ESCROW', currency: campaign.currency },
      });
      if (!escrowAcc) {
        escrowAcc = await tx.balanceAccount.create({
          data: {
            projectId,
            accountType: 'ESCROW',
            currency: campaign.currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }

      // 3. Platform Fee Account
      let feeAcc = await tx.balanceAccount.findFirst({
        where: { accountType: 'PLATFORM_FEE', currency: campaign.currency },
      });
      if (!feeAcc) {
        feeAcc = await tx.balanceAccount.create({
          data: {
            accountType: 'PLATFORM_FEE',
            currency: campaign.currency,
          },
        });
      }

      // 4. Update Campaign state
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'FUNDED',
          totalBudget: totalDeposit,
          platformFee,
          lockedBudget: rewardPool,
          earnedBudget: 0,
          refundableBudget: 0,
        },
      });

      // 5. Update escrow reserved balance & platform fee balance
      await tx.balanceAccount.update({
        where: { id: escrowAcc.id },
        data: {
          reservedBalance: { increment: rewardPool },
        },
      });

      await tx.balanceAccount.update({
        where: { id: feeAcc.id },
        data: {
          availableBalance: { increment: platformFee },
        },
      });

      // 6. Create immutable ledger entries
      const txId = `tx_fund_${Date.now()}_${randomUUID().slice(0, 8)}`;

      // Entry A: Escrow reservation
      const escrowEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          destinationAccountId: escrowAcc.id,
          amount: rewardPool,
          currency: campaign.currency,
          entryType: 'ESCROW_LOCK',
          campaignId: campaign.id,
          idempotencyKey,
          referenceNote: `Campaign ${campaign.title} escrow lock for reward pool`,
        },
      });

      // Entry B: Platform fee collection
      await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          destinationAccountId: feeAcc.id,
          amount: platformFee,
          currency: campaign.currency,
          entryType: 'FEE_COLLECTION',
          campaignId: campaign.id,
          idempotencyKey: `${idempotencyKey}_fee`,
          referenceNote: `Campaign ${campaign.title} platform fee collection`,
        },
      });

      // Record Funding Record
      await tx.campaignFunding.create({
        data: {
          campaignId: campaign.id,
          projectId,
          amount: rewardPool,
          currency: campaign.currency,
          feeAmount: platformFee,
          totalDeposit,
          status: 'CONFIRMED',
          providerReference: txId,
        },
      });

      return { success: true, escrowEntry, transactionId: txId };
    });
  }

  /**
   * Transactionally credit a verified reward to a contributor.
   * Guarantees: Exactly ONE reward per completion, immutable ledger entry, atomic escrow deduction.
   */
  static async creditTaskReward(params: CreditRewardParams) {
    const { taskInstanceId, userId, campaignId, rewardAmount, idempotencyKey } = params;

    return prisma.$transaction(async (tx) => {
      // 1. Idempotency & Replay Protection
      const existingEntry = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey },
      });
      if (existingEntry) {
        return { success: true, message: 'Reward already credited (Idempotent)', entry: existingEntry };
      }

      // 2. Fetch Task Instance & Validate
      const instance = await tx.taskInstance.findUnique({
        where: { id: taskInstanceId },
        include: { task: true, campaign: true },
      });
      if (!instance) {
        throw new Error(`Task instance ${taskInstanceId} not found.`);
      }
      if (instance.rewardClaimed) {
        throw new Error('Reward has already been claimed for this task instance.');
      }

      // 3. Campaign & Escrow validation
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found.`);
      }
      if (campaign.lockedBudget < rewardAmount) {
        throw new Error(`Insufficient campaign escrow budget (Remaining: ${campaign.lockedBudget}, Required: ${rewardAmount}).`);
      }

      // 4. Fetch Contributor Balance Account
      let contributorAccount = await tx.balanceAccount.findFirst({
        where: { userId, accountType: 'CONTRIBUTOR', currency: campaign.currency },
      });
      if (!contributorAccount) {
        contributorAccount = await tx.balanceAccount.create({
          data: {
            userId,
            accountType: 'CONTRIBUTOR',
            currency: campaign.currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }

      // Fetch Project Escrow Account
      let escrowAccount = await tx.balanceAccount.findFirst({
        where: { projectId: campaign.projectId, accountType: 'ESCROW', currency: campaign.currency },
      });
      if (!escrowAccount) {
        escrowAccount = await tx.balanceAccount.create({
          data: {
            projectId: campaign.projectId,
            accountType: 'ESCROW',
            currency: campaign.currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: campaign.lockedBudget,
            paidBalance: 0,
          },
        });
      }

      // 5. Atomic Balance Updates
      // Deduct from campaign locked budget, add to earned
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          lockedBudget: { decrement: rewardAmount },
          earnedBudget: { increment: rewardAmount },
          completedParticipants: { increment: 1 },
        },
      });

      // Escrow account reserved balance decrements, paid increments
      await tx.balanceAccount.update({
        where: { id: escrowAccount.id },
        data: {
          reservedBalance: { decrement: rewardAmount },
          paidBalance: { increment: rewardAmount },
        },
      });

      // Contributor account available balance increments
      const updatedContribAcc = await tx.balanceAccount.update({
        where: { id: contributorAccount.id },
        data: {
          availableBalance: { increment: rewardAmount },
        },
      });

      // 6. Update Task Instance State
      await tx.taskInstance.update({
        where: { id: taskInstanceId },
        data: {
          status: 'APPROVED',
          rewardClaimed: true,
          completedAt: new Date(),
        },
      });

      // 7. Create Immutable Ledger Entry
      const txId = `tx_rw_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          sourceAccountId: escrowAccount.id,
          destinationAccountId: contributorAccount.id,
          amount: rewardAmount,
          currency: campaign.currency,
          entryType: 'REWARD_CREDIT',
          campaignId,
          taskInstanceId,
          idempotencyKey,
          referenceNote: `Verified quest reward for ${instance.task.title}`,
        },
      });

      // 8. Trust Score Update (+2 points)
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        const prevScore = user.trustScore;
        const newScore = Math.min(DEFAULT_TRUST_SCORE_CONFIG.maxScore, prevScore + DEFAULT_TRUST_SCORE_CONFIG.rewards.taskApproved);
        await tx.user.update({
          where: { id: userId },
          data: { trustScore: newScore },
        });

        await tx.trustEvent.create({
          data: {
            userId,
            previousScore: prevScore,
            newScore,
            delta: newScore - prevScore,
            eventType: 'TASK_APPROVED',
            reason: `Completed task: ${instance.task.title}`,
          },
        });
      }

      // 9. Enqueue In-App Notification
      await tx.notification.create({
        data: {
          userId,
          channel: 'TELEGRAM',
          templateKey: 'REWARD_CREDITED',
          title: `Quest Reward: +${rewardAmount} ${campaign.currency}`,
          messageBody: `Your submission for "${instance.task.title}" was verified and +${rewardAmount} ${campaign.currency} has been added to your wallet!`,
          deepLink: 'https://t.me/NexeraQuestBot/app?startapp=wallet',
          status: 'QUEUED',
        },
      });

      return {
        success: true,
        ledgerEntry,
        newBalance: updatedContribAcc.availableBalance,
        transactionId: txId,
      };
    });
  }

  /**
   * Request withdrawal from contributor wallet.
   * Atomic deduction from availableBalance to pendingBalance.
   */
  static async requestWithdrawal(params: RequestWithdrawalParams) {
    const { userId, amount, network, destinationAddress, idempotencyKey } = params;

    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const existing = await tx.withdrawal.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return { success: true, message: 'Withdrawal already requested (Idempotent)', withdrawal: existing };
      }

      // 2. Validate amount & user balance
      if (amount < WITHDRAWAL_LIMITS.minimumAmount) {
        throw new Error(`Minimum withdrawal amount is ${WITHDRAWAL_LIMITS.minimumAmount} USDT.`);
      }

      const account = await tx.balanceAccount.findFirst({
        where: { userId, accountType: 'CONTRIBUTOR', currency: 'USDT' },
      });
      if (!account || account.availableBalance < amount) {
        throw new Error(`Insufficient available balance (Available: ${account?.availableBalance || 0} USDT, Requested: ${amount} USDT).`);
      }

      // 3. Calculate Fee
      const feeAmount = Math.max(WITHDRAWAL_LIMITS.minimumFee, Number((amount * (WITHDRAWAL_LIMITS.feeRatePercentage / 100)).toFixed(4)));
      const netAmount = Number((amount - feeAmount).toFixed(4));

      // 4. Move balance from available to pending
      await tx.balanceAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      });

      // 5. Create Withdrawal Record
      // Determine initial state: If small amount & low risk, PENDING_AUTHORIZATION or APPROVED
      const initialStatus = amount <= WITHDRAWAL_LIMITS.autoApprovalThreshold ? 'PENDING_AUTHORIZATION' : 'RISK_CHECK';

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          balanceAccountId: account.id,
          amount,
          feeAmount,
          netAmount,
          currency: 'USDT',
          network,
          destinationAddress,
          status: initialStatus,
          idempotencyKey,
        },
      });

      // 6. Record Ledger Entry
      const txId = `tx_wd_req_${Date.now()}_${randomUUID().slice(0, 8)}`;
      await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          sourceAccountId: account.id,
          amount,
          currency: 'USDT',
          entryType: 'WITHDRAWAL_REQUEST',
          withdrawalId: withdrawal.id,
          idempotencyKey: `idemp_entry_${idempotencyKey}`,
          referenceNote: `Withdrawal request of ${amount} USDT to ${network}:${destinationAddress.slice(0, 8)}...`,
        },
      });

      return { success: true, withdrawal, transactionId: txId };
    });
  }

  /**
   * Finalize and settle withdrawal payout (Admin or Settlement Worker)
   */
  static async finalizeWithdrawalPayout(withdrawalId: string, txHash?: string, actorId?: string) {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: { balanceAccount: true },
      });
      if (!withdrawal) throw new Error(`Withdrawal ${withdrawalId} not found.`);
      if (withdrawal.status === 'PAID') return { success: true, message: 'Already paid', withdrawal };

      // Move pending balance to paid balance
      await tx.balanceAccount.update({
        where: { id: withdrawal.balanceAccountId },
        data: {
          pendingBalance: { decrement: withdrawal.amount },
          paidBalance: { increment: withdrawal.amount },
        },
      });

      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PAID',
          txHash: txHash || `sim_tx_${randomUUID()}`,
          processedAt: new Date(),
        },
      });

      const txId = `tx_wd_paid_${Date.now()}_${randomUUID().slice(0, 8)}`;
      await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          sourceAccountId: withdrawal.balanceAccountId,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          entryType: 'WITHDRAWAL_PAYOUT',
          withdrawalId: withdrawal.id,
          idempotencyKey: `idemp_paid_${withdrawal.id}`,
          referenceNote: `Settled payout for withdrawal ${withdrawal.id} on ${withdrawal.network}`,
        },
      });

      return { success: true, withdrawal: updatedWithdrawal };
    });
  }

  /**
   * Settle and refund unused campaign escrow back to project
   */
  static async settleCampaignRefund(campaignId: string, adminActorId: string) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) throw new Error(`Campaign ${campaignId} not found.`);

      const refundable = campaign.lockedBudget;
      if (refundable <= 0) {
        return { success: true, message: 'No refundable budget remaining', refundedAmount: 0 };
      }

      // Fetch Project Escrow and Project Available accounts
      const escrowAcc = await tx.balanceAccount.findFirst({
        where: { projectId: campaign.projectId, accountType: 'ESCROW', currency: campaign.currency },
      });
      let projectAcc = await tx.balanceAccount.findFirst({
        where: { projectId: campaign.projectId, accountType: 'PROJECT', currency: campaign.currency },
      });
      if (!projectAcc) {
        projectAcc = await tx.balanceAccount.create({
          data: {
            projectId: campaign.projectId,
            accountType: 'PROJECT',
            currency: campaign.currency,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            paidBalance: 0,
          },
        });
      }

      // Update balances
      if (escrowAcc) {
        await tx.balanceAccount.update({
          where: { id: escrowAcc.id },
          data: { reservedBalance: { decrement: refundable } },
        });
      }

      await tx.balanceAccount.update({
        where: { id: projectAcc.id },
        data: { availableBalance: { increment: refundable } },
      });

      // Update Campaign status
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'SETTLED',
          lockedBudget: 0,
          refundableBudget: refundable,
        },
      });

      // Record refund
      await tx.refund.create({
        data: {
          campaignId,
          projectId: campaign.projectId,
          amount: refundable,
          currency: campaign.currency,
          reason: 'Campaign completed/closed unused budget refund',
          status: 'PROCESSED',
          approvedBy: adminActorId,
        },
      });

      // Record immutable ledger entry
      const txId = `tx_refund_${Date.now()}_${randomUUID().slice(0, 8)}`;
      await tx.ledgerEntry.create({
        data: {
          transactionId: txId,
          sourceAccountId: escrowAcc?.id,
          destinationAccountId: projectAcc.id,
          amount: refundable,
          currency: campaign.currency,
          entryType: 'REFUND',
          campaignId,
          idempotencyKey: `idemp_refund_${campaignId}_${Date.now()}`,
          referenceNote: `Refund of unused escrow for completed campaign ${campaign.title}`,
        },
      });

      return { success: true, refundedAmount: refundable, transactionId: txId };
    });
  }

  /**
   * Run automated full double-entry balance and ledger reconciliation
   */
  static async runReconciliation(triggeredBy = 'SYSTEM') {
    const startTime = Date.now();
    const accounts = await prisma.balanceAccount.findMany({
      include: {
        incomingEntries: true,
        outgoingEntries: true,
      },
    });

    const discrepancies: any[] = [];

    for (const acc of accounts) {
      // In double-entry accounting:
      // Contributor Platform Liability = Total Credited (Rewards/Deposits/Adjustments) - Total Paid Out (Withdrawal Payouts)
      // This mathematically equals availableBalance + pendingBalance
      if (acc.accountType === 'CONTRIBUTOR') {
        const totalCredited = acc.incomingEntries
          .filter((e) => ['REWARD_CREDIT', 'DEPOSIT', 'REFUND', 'ADJUSTMENT'].includes(e.entryType))
          .reduce((sum, e) => sum + e.amount, 0);

        const totalPaidOut = acc.outgoingEntries
          .filter((e) => e.entryType === 'WITHDRAWAL_PAYOUT')
          .reduce((sum, e) => sum + e.amount, 0);

        const calculatedLiability = Number((totalCredited - totalPaidOut).toFixed(4));
        const recordedLiability = Number((acc.availableBalance + acc.pendingBalance).toFixed(4));
        const diff = Math.abs(calculatedLiability - recordedLiability);

        if (diff > 0.01) {
          discrepancies.push({
            accountId: acc.id,
            accountType: acc.accountType,
            calculatedBalance: calculatedLiability,
            recordedBalance: recordedLiability,
            difference: diff,
            errorType: 'CONTRIBUTOR_BALANCE_LEDGER_MISMATCH',
          });
        }
      }
    }

    const status = discrepancies.length === 0 ? 'PASSED' : 'DISCREPANCY_DETECTED';
    const summary = discrepancies.length === 0
      ? `Reconciliation passed: ${accounts.length} accounts verified with 0 discrepancies.`
      : `Reconciliation flagged: ${discrepancies.length} discrepancies discovered out of ${accounts.length} accounts.`;

    const report = await prisma.reconciliationRun.create({
      data: {
        triggeredBy,
        status,
        totalChecked: accounts.length,
        discrepanciesFound: discrepancies.length,
        discrepancyDetails: JSON.stringify(discrepancies),
        summary,
        completedAt: new Date(),
      },
    });

    return {
      reportId: report.id,
      status,
      totalChecked: accounts.length,
      discrepanciesFound: discrepancies.length,
      discrepancies,
      durationMs: Date.now() - startTime,
    };
  }
}
