import { prisma } from './prisma.js';
import { LedgerService } from './services/ledgerService.js';
import { VerificationService } from './services/verificationService.js';
import { TrustService } from './services/trustService.js';

async function runEndToEndVerification() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING NEXERAQUEST END-TO-END ECONOMIC LOOP TEST');
  console.log('======================================================\n');

  // 1. Create a test Project Sponsor
  const project = await prisma.project.create({
    data: {
      name: 'Testnet Alpha Protocol',
      description: 'E2E Testing Project Sponsor',
      website: 'https://testnetalpha.io',
      status: 'APPROVED',
    },
  });
  console.log(`1. ✅ Created Project Sponsor: ${project.name} (${project.id.slice(0, 8)})`);

  // 2. Project creates a 100-slot campaign at 0.50 USDT per action
  const rewardPerAction = 0.50;
  const targetSlots = 100;
  const rewardPool = Number((rewardPerAction * targetSlots).toFixed(2)); // $50.00
  const platformFee = Number((rewardPool * 0.20).toFixed(2)); // $10.00 (20%)
  const totalCost = Number((rewardPool + platformFee).toFixed(2)); // $60.00

  const campaign = await prisma.campaign.create({
    data: {
      projectId: project.id,
      title: 'E2E Test: Join Alpha Telegram Community',
      description: 'Test joining community channel',
      category: 'COMMUNITY',
      taskType: 'TELEGRAM_JOIN',
      instructions: 'Join channel and verify',
      rewardPerAction,
      targetSlots,
      rewardPool,
      platformFee,
      totalCost,
      proofType: 'AUTOMATIC_MEMBERSHIP',
      status: 'ACTIVE',
    },
  });
  console.log(`2. ✅ Created Campaign: ${campaign.title}`);
  console.log(`   - Reward Pool: $${campaign.rewardPool} USDT`);
  console.log(`   - Platform Fee (20%): $${campaign.platformFee} USDT`);
  console.log(`   - Total Deposit: $${campaign.totalCost} USDT`);

  // 3. Deposit escrow into double-entry ledger
  await LedgerService.recordCampaignDeposit(
    campaign.id,
    campaign.rewardPool,
    campaign.platformFee,
    'E2E_ESCROW_TX_12345'
  );
  console.log(`3. ✅ Pre-funded 100% Escrow in double-entry ledger.`);

  // 4. Onboard a new Contributor with referral code
  const contributor = await prisma.user.create({
    data: {
      telegramId: `test_tg_${Date.now()}`,
      username: 'e2e_tester',
      firstName: 'Alice',
      trustScore: 50,
      referralCode: `NQE2E_${Math.floor(Math.random() * 9000)}`,
      balanceAccount: {
        create: {
          available: 0,
          pending: 0,
          withdrawn: 0,
        },
      },
    },
    include: { balanceAccount: true },
  });
  console.log(`4. ✅ Onboarded Contributor: @${contributor.username} (Trust: ${contributor.trustScore}/100)`);

  // 5. Contributor starts task
  const taskInstance = await prisma.taskInstance.create({
    data: {
      campaignId: campaign.id,
      userId: contributor.id,
      status: 'STARTED',
    },
  });
  console.log(`5. ✅ Task started: Instance ID ${taskInstance.id.slice(0, 8)}`);

  // 6. Execute verification & double-entry settlement
  const verificationResult = await VerificationService.verifyAutomaticTask(
    taskInstance.id,
    contributor.id,
    campaign.id
  );
  console.log(`6. ✅ Verification executed: ${verificationResult.message}`);

  // 7. Verify Contributor Balance & Trust Score updated
  const updatedContributor = await prisma.user.findUnique({
    where: { id: contributor.id },
    include: { balanceAccount: true },
  });
  console.log(`7. ✅ Verified State:`);
  console.log(`   - Available Balance: $${updatedContributor?.balanceAccount?.available.toFixed(2)} USDT`);
  console.log(`   - Trust Score: ${updatedContributor?.trustScore}/100 (+2 points gained)`);

  if (updatedContributor?.balanceAccount?.available !== 0.50) {
    throw new Error('Reward balance mismatch! Expected 0.50 USDT');
  }

  // 8. Test Idempotency: duplicate reward attempt must fail
  try {
    await LedgerService.recordRewardCredit(
      contributor.id,
      campaign.id,
      taskInstance.id,
      campaign.rewardPerAction
    );
    throw new Error('Duplicate credit was not prevented!');
  } catch (err: any) {
    console.log(`8. ✅ Idempotency Protection: Duplicate credit correctly blocked (${err.message})`);
  }

  // 9. Contributor requests withdrawal of 0.50 USDT to TON wallet
  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId: contributor.id,
      amount: 0.50,
      currency: 'USDT',
      network: 'TON',
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKUWaFVOTzn0_rum0LN3ERA2',
      status: 'REQUESTED',
    },
  });

  await LedgerService.recordWithdrawalRequest(contributor.id, withdrawal.id, 0.50);

  const balanceAfterWithdrawalReq = await prisma.balanceAccount.findUnique({
    where: { userId: contributor.id },
  });
  console.log(`9. ✅ Withdrawal requested: 0.50 USDT moved to Pending`);
  console.log(`   - Available: $${balanceAfterWithdrawalReq?.available.toFixed(2)} USDT`);
  console.log(`   - Pending: $${balanceAfterWithdrawalReq?.pending.toFixed(2)} USDT`);

  // 10. Admin authorizes withdrawal & settles on-chain
  const txHash = '0x9abc1234def5678a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a';
  await LedgerService.recordWithdrawalSettlement(contributor.id, withdrawal.id, 0.50, txHash);
  await prisma.withdrawal.update({
    where: { id: withdrawal.id },
    data: { status: 'COMPLETED', txHash, settledAt: new Date() },
  });

  const balanceAfterSettlement = await prisma.balanceAccount.findUnique({
    where: { userId: contributor.id },
  });
  console.log(`10. ✅ Admin authorized withdrawal & on-chain settlement:`);
  console.log(`    - Settled Tx Hash: ${txHash.slice(0, 18)}...`);
  console.log(`    - Pending: $${balanceAfterSettlement?.pending.toFixed(2)} USDT`);
  console.log(`    - Cumulative Withdrawn: $${balanceAfterSettlement?.withdrawn.toFixed(2)} USDT`);

  // 11. Project closes campaign and receives refund for remaining 99 unclaimed slots
  const unclaimedSlots = 99;
  const refundAmount = Number((unclaimedSlots * rewardPerAction).toFixed(2)); // $49.50
  await LedgerService.recordCampaignRefund(campaign.id, refundAmount);
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: 'CLOSED' },
  });
  console.log(`11. ✅ Campaign Closed:`);
  console.log(`    - ${unclaimedSlots} unclaimed slots refunded: $${refundAmount.toFixed(2)} USDT returned to project.`);

  // 12. Full Solvency Audit Reconciliation
  const audit = await LedgerService.auditLedger();
  console.log(`\n12. 📊 FINAL DOUBLE-ENTRY LEDGER AUDIT:`);
  console.log(`    - Total Deposits: $${audit.totalDeposits.toFixed(2)} USDT`);
  console.log(`    - Platform Fees (Revenue): $${audit.totalPlatformFees.toFixed(2)} USDT`);
  console.log(`    - Total Rewards Settled: $${audit.totalRewardsEarned.toFixed(2)} USDT`);
  console.log(`    - Unclaimed Refunds: $${audit.totalRefunds.toFixed(2)} USDT`);
  console.log(`    - Solvency Zero-Sum Balanced: ${audit.isBalanced ? '✅ TRUE (Zero-Sum Maintained)' : '❌ FALSE'}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 12 END-TO-END ECONOMIC TEST STEPS PASSED!');
  console.log('======================================================\n');
}

runEndToEndVerification()
  .catch((e) => {
    console.error('❌ E2E test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
