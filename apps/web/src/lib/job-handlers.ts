import { registerHandler } from '@nexeraquest/queue';

/**
 * Registers background job handlers once per server process.
 * Handlers are idempotent — safe to re-run after crashes or retries.
 * Import this module from instrumentation / layout so registration
 * happens before any enqueue call.
 */

let registered = false;

export function registerJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerHandler('verify-task', async (payload: { taskInstanceId: string }) => {
    const { prisma } = await import('@nexeraquest/database');
    const { VerificationEngine } = await import('@nexeraquest/verification');
    const { LedgerEngine } = await import('@nexeraquest/ledger');

    const instance = await prisma.taskInstance.findUnique({
      where: { id: payload.taskInstanceId },
      include: { campaign: true },
    });
    if (!instance) return;
    if (instance.status === 'APPROVED') return; // already settled
    if (instance.campaign.status !== 'LIVE') return; // paused/closed — skip

    const outcome = await VerificationEngine.verifyTaskInstance(instance.id);
    if (outcome.status === 'VERIFIED') {
      await LedgerEngine.creditTaskReward({
        taskInstanceId: instance.id,
        userId: instance.userId,
        campaignId: instance.campaignId,
        rewardAmount: instance.campaign.rewardPerAction,
        idempotencyKey: `rw_task_${instance.id}`,
      });
    }
  });

  registerHandler('send-notification', async (payload: { userId: string; templateKey: string; title: string; messageBody: string; deepLinkRoute?: string }) => {
    const { NotificationDispatcher } = await import('@nexeraquest/notifications');
    await NotificationDispatcher.dispatch({
      userId: payload.userId,
      templateKey: payload.templateKey,
      title: payload.title,
      messageBody: payload.messageBody,
      deepLinkRoute: payload.deepLinkRoute,
    });
  });

  registerHandler('evaluate-fraud', async (payload: { userId: string }) => {
    const { FraudEngine } = await import('@nexeraquest/fraud');
    await FraudEngine.evaluateUserRisk(payload.userId);
  });

  registerHandler('settle-withdrawal', async (payload: { withdrawalId: string }) => {
    const { LedgerEngine } = await import('@nexeraquest/ledger');
    const { prisma } = await import('@nexeraquest/database');
    const wd = await prisma.withdrawal.findUnique({ where: { id: payload.withdrawalId } });
    if (!wd || wd.status !== 'PENDING_AUTHORIZATION') return;
    await LedgerEngine.finalizeWithdrawalPayout(wd.id, undefined, 'QUEUE_WORKER');
  });

  registerHandler('reconcile', async () => {
    const { LedgerEngine } = await import('@nexeraquest/ledger');
    const report = await LedgerEngine.runReconciliation('QUEUE_WORKER');
    if (report.discrepanciesFound > 0) {
      console.warn('[queue:reconcile] discrepancies:', JSON.stringify(report.discrepancies));
    }
  });

  registerHandler('expire-campaigns', async () => {
    const { prisma } = await import('@nexeraquest/database');
    const { LedgerEngine } = await import('@nexeraquest/ledger');
    const now = new Date();
    const expired = await prisma.campaign.findMany({
      where: { status: 'LIVE', endDate: { lte: now } },
    });
    for (const cmp of expired) {
      await prisma.campaign.update({ where: { id: cmp.id }, data: { status: 'COMPLETED' } });
      await LedgerEngine.settleCampaignRefund(cmp.id, 'QUEUE_WORKER');
    }
  });
}
