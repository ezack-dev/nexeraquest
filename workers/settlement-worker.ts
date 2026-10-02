import { prisma } from '@nexeraquest/database';
import { LedgerEngine } from '@nexeraquest/ledger';

async function runWorker() {
  console.log('⚡ [Worker:Settlement] Processing campaign schedules and auto-approvals...');
  try {
    const now = new Date();

    // 1. Expire campaigns whose endDate has passed
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        endDate: { lte: now },
      },
    });

    for (const cmp of expiredCampaigns) {
      console.log(`⌛ [Worker:Settlement] Expiring campaign ${cmp.id} (${cmp.title})`);
      await prisma.campaign.update({
        where: { id: cmp.id },
        data: { status: 'COMPLETED' },
      });
      // Settle refund of unused budget
      await LedgerEngine.settleCampaignRefund(cmp.id, 'SETTLEMENT_WORKER');
    }

    // 2. Auto-process low-risk small withdrawals in sandbox or under threshold
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING_AUTHORIZATION' },
      take: 10,
    });

    for (const wd of pendingWithdrawals) {
      console.log(`💸 [Worker:Settlement] Auto-processing low-risk withdrawal ${wd.id} of ${wd.amount} USDT to ${wd.network}`);
      await LedgerEngine.finalizeWithdrawalPayout(wd.id, undefined, 'SETTLEMENT_WORKER');
    }

    console.log('✅ [Worker:Settlement] Settlement worker cycle complete.');
  } catch (err: any) {
    console.error('❌ [Worker:Settlement] Execution error:', err.message);
  }
}

if (require.main === module) {
  runWorker().then(() => process.exit(0));
}

export { runWorker };
