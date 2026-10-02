import { prisma } from './index';

async function main() {
  console.log('🌱 Starting NexeraQuest Production Seed...');

  // 1. System Settings & Pricing Rules
  await prisma.pricingRule.upsert({
    where: { id: 'rule_default_standard' },
    update: {},
    create: {
      id: 'rule_default_standard',
      name: 'Standard Variable Tier (15%)',
      feePercentage: 15.0,
      minimumFee: 25.0,
      flatFee: 0.0,
      currency: 'USDT',
      isActive: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'TELEGRAM_MEMBERSHIP_VERIFICATION' },
    update: {},
    create: {
      key: 'TELEGRAM_MEMBERSHIP_VERIFICATION',
      name: 'Telegram Membership Verification',
      description: 'Enables automated verification of group/channel joins via bot',
      isEnabled: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'REFERRAL_SYSTEM' },
    update: {},
    create: {
      key: 'REFERRAL_SYSTEM',
      name: 'Referral Engine',
      description: 'Enables contributor referral tracking and bounty rewards',
      isEnabled: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'X_TWITTER_VERIFICATION' },
    update: {},
    create: {
      key: 'X_TWITTER_VERIFICATION',
      name: 'X (Twitter) Verification',
      description: 'Future adapter plug for X follow and retweet verification',
      isEnabled: false,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'MINIMUM_WITHDRAWAL_AMOUNT' },
    update: {},
    create: {
      key: 'MINIMUM_WITHDRAWAL_AMOUNT',
      value: JSON.stringify({ amount: 5.0, currency: 'USDT' }),
      description: 'Minimum amount required to request a withdrawal',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'RECONCILIATION_FREQUENCY_HOURS' },
    update: {},
    create: {
      key: 'RECONCILIATION_FREQUENCY_HOURS',
      value: JSON.stringify({ hours: 6 }),
      description: 'Interval in hours for automated ledger balance reconciliation runs',
    },
  });

  // 2. Platform Accounts
  const platformFeeAccount = await prisma.balanceAccount.upsert({
    where: { id: 'acc_platform_fees_usdt' },
    update: {},
    create: {
      id: 'acc_platform_fees_usdt',
      accountType: 'PLATFORM_FEE',
      availableBalance: 245.50,
      pendingBalance: 0.0,
      reservedBalance: 0.0,
      paidBalance: 0.0,
      currency: 'USDT',
    },
  });

  // 3. Admin & Operators
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexeraquest.io' },
    update: {},
    create: {
      id: 'usr_admin_master',
      email: 'admin@nexeraquest.io',
      telegramUsername: 'nexera_ops',
      telegramId: '990001001',
      firstName: 'Sovereign',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      trustScore: 100,
    },
  });

  const projectLead = await prisma.user.upsert({
    where: { email: 'lead@tondefi.io' },
    update: {},
    create: {
      id: 'usr_project_lead_1',
      email: 'lead@tondefi.io',
      telegramUsername: 'tondefi_lead',
      telegramId: '990002002',
      firstName: 'Alex',
      lastName: 'Vane',
      role: 'PROJECT_OWNER',
      status: 'ACTIVE',
      trustScore: 95,
    },
  });

  // 4. Contributors
  const contributor1 = await prisma.user.upsert({
    where: { telegramId: '123456789' },
    update: {},
    create: {
      id: 'usr_contributor_1',
      telegramId: '123456789',
      telegramUsername: 'cryptodave',
      firstName: 'David',
      lastName: 'Chen',
      role: 'CONTRIBUTOR',
      status: 'ACTIVE',
      trustScore: 88,
      referralCode: 'DAVE88',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const contributor2 = await prisma.user.upsert({
    where: { telegramId: '987654321' },
    update: {},
    create: {
      id: 'usr_contributor_2',
      telegramId: '987654321',
      telegramUsername: 'elenazk',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'CONTRIBUTOR',
      status: 'ACTIVE',
      trustScore: 42,
      referralCode: 'ELENA42',
      referredById: contributor1.id,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
  });

  // Balance Accounts for Contributors
  const contrib1Account = await prisma.balanceAccount.upsert({
    where: { id: 'acc_usr_contrib_1_usdt' },
    update: {},
    create: {
      id: 'acc_usr_contrib_1_usdt',
      userId: contributor1.id,
      accountType: 'CONTRIBUTOR',
      availableBalance: 48.50,
      pendingBalance: 5.00,
      reservedBalance: 0.0,
      paidBalance: 120.00,
      currency: 'USDT',
    },
  });

  await prisma.balanceAccount.upsert({
    where: { id: 'acc_usr_contrib_2_usdt' },
    update: {},
    create: {
      id: 'acc_usr_contrib_2_usdt',
      userId: contributor2.id,
      accountType: 'CONTRIBUTOR',
      availableBalance: 4.00,
      pendingBalance: 2.00,
      reservedBalance: 0.0,
      paidBalance: 0.0,
      currency: 'USDT',
    },
  });

  // 5. Web3 Projects
  const project1 = await prisma.project.upsert({
    where: { slug: 'ton-defi-hub' },
    update: {},
    create: {
      id: 'prj_ton_defi',
      name: 'TonDeFi Hub',
      slug: 'ton-defi-hub',
      description: 'Decentralized liquidity and automated market maker built natively for Telegram Open Network.',
      website: 'https://tondefi.io',
      twitterUrl: 'https://x.com/tondefi_hub',
      telegramUrl: 'https://t.me/tondefi_announcements',
      verificationStatus: 'VERIFIED',
      operatorEmail: 'lead@tondefi.io',
      logoUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128',
      bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project1.id,
        userId: projectLead.id,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: projectLead.id,
      role: 'OWNER',
      permissions: 'ALL',
    },
  });

  const project2 = await prisma.project.upsert({
    where: { slug: 'aethir-compute' },
    update: {},
    create: {
      id: 'prj_aethir_compute',
      name: 'Aethir Cloud Compute',
      slug: 'aethir-compute',
      description: 'Enterprise-grade decentralized cloud infrastructure for AI and gaming compute scaling.',
      website: 'https://aethir.com',
      twitterUrl: 'https://x.com/AethirCloud',
      telegramUrl: 'https://t.me/aethir_official',
      verificationStatus: 'VERIFIED',
      operatorEmail: 'growth@aethir.com',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    },
  });

  // Project Escrow Accounts
  const project1Escrow = await prisma.balanceAccount.upsert({
    where: { id: 'acc_prj_ton_defi_escrow' },
    update: {},
    create: {
      id: 'acc_prj_ton_defi_escrow',
      projectId: project1.id,
      accountType: 'ESCROW',
      availableBalance: 0.0,
      pendingBalance: 0.0,
      reservedBalance: 420.00, // Escrow locked for active campaigns
      paidBalance: 80.00,
      currency: 'USDT',
    },
  });

  // 6. Campaigns
  const campaign1 = await prisma.campaign.upsert({
    where: { slug: 'ton-defi-early-adopters' },
    update: {},
    create: {
      id: 'cmp_ton_early_adopters',
      projectId: project1.id,
      title: 'TonDeFi Early Adopter Vanguard',
      slug: 'ton-defi-early-adopters',
      description: 'Join the official TonDeFi Telegram announcement channel and discover our zero-slippage liquidity pools. Earn verified USDT rewards upon joining.',
      category: 'Community',
      coverUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      status: 'LIVE',
      rewardPerAction: 2.50,
      targetParticipants: 200,
      completedParticipants: 32,
      totalBudget: 575.00, // 500 reward pool + 75 fee
      platformFee: 75.00,
      lockedBudget: 420.00,
      earnedBudget: 80.00,
      refundableBudget: 0.0,
      currency: 'USDT',
      verificationType: 'TELEGRAM_CHANNEL',
      verificationConfig: JSON.stringify({
        channelUsername: '@tondefi_announcements',
        requireMembership: true,
      }),
      eligibilityConfig: JSON.stringify({
        minTrustScore: 40,
        maxCompletionsPerUser: 1,
      }),
      startDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    },
  });

  // Campaign Tasks
  const task1 = await prisma.campaignTask.upsert({
    where: { id: 'tsk_join_tondefi_channel' },
    update: {},
    create: {
      id: 'tsk_join_tondefi_channel',
      campaignId: campaign1.id,
      title: 'Join TonDeFi Official Telegram Channel',
      taskType: 'TELEGRAM_CHANNEL',
      actionType: 'JOIN_CHANNEL',
      destinationUrl: 'https://t.me/tondefi_announcements',
      instructions: 'Click the link to join @tondefi_announcements. Remain in the channel while verification checks membership. Do not leave before reward is settled.',
      proofRequirements: 'Automated Telegram Bot verification of chat membership.',
      timerSeconds: 600,
      orderIndex: 1,
      verificationAdapter: 'TELEGRAM_MEMBERSHIP',
      adapterConfig: JSON.stringify({
        chatId: '@tondefi_announcements',
        expectedRoles: ['member', 'administrator', 'creator'],
      }),
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { slug: 'aethir-node-operator-feedback' },
    update: {},
    create: {
      id: 'cmp_aethir_feedback',
      projectId: project2.id,
      title: 'Aethir Compute Node Usability Survey',
      slug: 'aethir-node-operator-feedback',
      description: 'Test the Aethir Decentralized GPU Portal on testnet, submit your transaction hash or dashboard screenshot, and provide structured UX feedback.',
      category: 'Testing',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      status: 'LIVE',
      rewardPerAction: 5.00,
      targetParticipants: 100,
      completedParticipants: 18,
      totalBudget: 575.00,
      platformFee: 75.00,
      lockedBudget: 410.00,
      earnedBudget: 90.00,
      refundableBudget: 0.0,
      currency: 'USDT',
      verificationType: 'CONTENT_REVIEW',
      verificationConfig: JSON.stringify({
        requireProofUpload: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/json'],
      }),
      eligibilityConfig: JSON.stringify({
        minTrustScore: 50,
      }),
      startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    },
  });

  await prisma.campaignTask.upsert({
    where: { id: 'tsk_submit_node_survey' },
    update: {},
    create: {
      id: 'tsk_submit_node_survey',
      campaignId: campaign2.id,
      title: 'Submit Node Benchmark Log & Feedback',
      taskType: 'CONTENT_REVIEW',
      actionType: 'SUBMIT_PROOF',
      destinationUrl: 'https://testnet.aethir.com',
      instructions: 'Deploy a sandbox node instance, capture your GPU telemetry benchmark screenshot, and submit the link or image along with your thoughts.',
      proofRequirements: 'Valid screenshot or explorer link showing completed testnet workload.',
      timerSeconds: 1800,
      orderIndex: 1,
      verificationAdapter: 'CONTENT_REVIEW',
      adapterConfig: JSON.stringify({
        proofType: 'IMAGE_UPLOAD',
        minCharacters: 50,
      }),
    },
  });

  // Campaign 3: In Admin Approval Queue
  await prisma.campaign.upsert({
    where: { slug: 'zk-privacy-viral-thread' },
    update: {},
    create: {
      id: 'cmp_zk_privacy_viral',
      projectId: project1.id,
      title: 'Zero Knowledge Security Deep Dive Thread',
      slug: 'zk-privacy-viral-thread',
      description: 'Create an educational thread explaining private rollups and quote-tweet the official release announcement.',
      category: 'Creative',
      coverUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      status: 'UNDER_REVIEW',
      rewardPerAction: 15.00,
      targetParticipants: 30,
      completedParticipants: 0,
      totalBudget: 517.50,
      platformFee: 67.50,
      lockedBudget: 450.00,
      earnedBudget: 0.0,
      refundableBudget: 0.0,
      currency: 'USDT',
      verificationType: 'CONTENT_REVIEW',
      verificationConfig: JSON.stringify({
        requireProofUpload: true,
      }),
      eligibilityConfig: JSON.stringify({
        minTrustScore: 70,
      }),
    },
  });

  // 7. Task Instances & Proofs
  // Approved task for contributor1
  const completedInstance = await prisma.taskInstance.upsert({
    where: {
      campaignTaskId_userId: {
        campaignTaskId: task1.id,
        userId: contributor1.id,
      },
    },
    update: {},
    create: {
      id: 'inst_contrib1_task1_completed',
      campaignTaskId: task1.id,
      campaignId: campaign1.id,
      userId: contributor1.id,
      status: 'APPROVED',
      startedAt: new Date(Date.now() - 3600 * 1000 * 2),
      submittedAt: new Date(Date.now() - 3600 * 1000 * 1.9),
      verifiedAt: new Date(Date.now() - 3600 * 1000 * 1.8),
      completedAt: new Date(Date.now() - 3600 * 1000 * 1.8),
      rewardClaimed: true,
      metadata: JSON.stringify({
        telegramUserId: '123456789',
        verifiedRole: 'member',
      }),
    },
  });

  // Ledger entry for that approved task
  await prisma.ledgerEntry.upsert({
    where: { idempotencyKey: 'idemp_reward_inst_contrib1_task1_completed' },
    update: {},
    create: {
      transactionId: 'tx_reward_001',
      sourceAccountId: project1Escrow.id,
      destinationAccountId: contrib1Account.id,
      amount: 2.50,
      currency: 'USDT',
      entryType: 'REWARD_CREDIT',
      campaignId: campaign1.id,
      taskInstanceId: completedInstance.id,
      idempotencyKey: 'idemp_reward_inst_contrib1_task1_completed',
      referenceNote: 'Reward credit for TonDeFi Early Adopter Vanguard task completion',
    },
  });

  // Trust Event
  await prisma.trustEvent.create({
    data: {
      userId: contributor1.id,
      previousScore: 86,
      newScore: 88,
      delta: 2,
      eventType: 'TASK_APPROVED',
      reason: 'Successfully completed and verified task in campaign TonDeFi Early Adopter Vanguard',
    },
  });

  // 8. Fraud Case Seed
  await prisma.fraudCase.upsert({
    where: { id: 'frd_case_9901' },
    update: {},
    create: {
      id: 'frd_case_9901',
      userId: contributor2.id,
      riskScore: 78,
      severity: 'HIGH',
      status: 'INVESTIGATING',
      resolutionNotes: 'Flagged for multiple task submissions from same subnet within 12 seconds.',
      signals: {
        create: [
          {
            userId: contributor2.id,
            signalType: 'VELOCITY_SPIKE',
            weight: 35,
            details: 'Attempted 5 verification checks across 3 campaigns within 15 seconds.',
          },
          {
            userId: contributor2.id,
            signalType: 'TELEGRAM_AGE',
            weight: 25,
            details: 'Telegram account created less than 48 hours ago.',
          },
        ],
      },
    },
  });

  // 9. Dispute Seed
  await prisma.dispute.upsert({
    where: { id: 'dsp_dispute_001' },
    update: {},
    create: {
      id: 'dsp_dispute_001',
      taskInstanceId: completedInstance.id,
      userId: contributor2.id,
      projectId: project1.id,
      initiatedBy: 'CONTRIBUTOR',
      reason: 'Channel membership bot returned temporary rate limit and marked task not verified even though I was in the chat.',
      proofSummary: 'Joined @tondefi_announcements at 14:02 UTC. Screenshot attached.',
      status: 'UNDER_REVIEW',
    },
  });

  // 10. Withdrawals & Backing Ledger Entries
  await prisma.withdrawal.upsert({
    where: { idempotencyKey: 'idemp_wd_paid_001' },
    update: {},
    create: {
      id: 'wd_paid_001',
      userId: contributor1.id,
      balanceAccountId: contrib1Account.id,
      amount: 100.00,
      feeAmount: 1.00,
      netAmount: 99.00,
      currency: 'USDT',
      network: 'TON',
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKU9G86UM3hEHYP2cgP96h22',
      status: 'PAID',
      txHash: '0x8849b2938a1f89c02b37494a8e29a9f298e3b1c9029a8f273b499120938bfe41',
      idempotencyKey: 'idemp_wd_paid_001',
      processedAt: new Date(Date.now() - 3600 * 1000 * 24),
    },
  });

  // Backing ledger entry for paid withdrawal
  await prisma.ledgerEntry.upsert({
    where: { idempotencyKey: 'idemp_paid_wd_paid_001' },
    update: {},
    create: {
      transactionId: 'tx_wd_payout_001',
      sourceAccountId: contrib1Account.id,
      amount: 100.00,
      currency: 'USDT',
      entryType: 'WITHDRAWAL_PAYOUT',
      withdrawalId: 'wd_paid_001',
      idempotencyKey: 'idemp_paid_wd_paid_001',
      referenceNote: 'Paid withdrawal payout of 100 USDT on TON network',
    },
  });

  await prisma.withdrawal.upsert({
    where: { idempotencyKey: 'idemp_wd_pending_002' },
    update: {},
    create: {
      id: 'wd_pending_002',
      userId: contributor1.id,
      balanceAccountId: contrib1Account.id,
      amount: 5.00,
      feeAmount: 0.50,
      netAmount: 4.50,
      currency: 'USDT',
      network: 'TON',
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKU9G86UM3hEHYP2cgP96h22',
      status: 'PENDING_AUTHORIZATION',
      idempotencyKey: 'idemp_wd_pending_002',
    },
  });

  // Backing historical rewards for contributor 1 (Total: 48.50 available + 5.00 pending + 100.00 paid = 153.50; 2.50 already in task1 reward, so 151.00 historical)
  await prisma.ledgerEntry.upsert({
    where: { idempotencyKey: 'idemp_hist_rw_contrib1' },
    update: {},
    create: {
      transactionId: 'tx_hist_rw_001',
      destinationAccountId: contrib1Account.id,
      amount: 151.00,
      currency: 'USDT',
      entryType: 'REWARD_CREDIT',
      idempotencyKey: 'idemp_hist_rw_contrib1',
      referenceNote: 'Historical verified quest reward allocations',
    },
  });

  // Backing historical rewards for contributor 2 (4.00 available + 2.00 pending = 6.00 total)
  const contrib2Account = await prisma.balanceAccount.findFirst({
    where: { userId: contributor2.id, accountType: 'CONTRIBUTOR' },
  });
  if (contrib2Account) {
    await prisma.ledgerEntry.upsert({
      where: { idempotencyKey: 'idemp_hist_rw_contrib2' },
      update: {},
      create: {
        transactionId: 'tx_hist_rw_002',
        destinationAccountId: contrib2Account.id,
        amount: 6.00,
        currency: 'USDT',
        entryType: 'REWARD_CREDIT',
        idempotencyKey: 'idemp_hist_rw_contrib2',
        referenceNote: 'Historical verified quest rewards for contributor 2',
      },
    });
  }

  // 11. Notifications
  await prisma.notification.create({
    data: {
      userId: contributor1.id,
      channel: 'TELEGRAM',
      templateKey: 'REWARD_CREDITED',
      title: 'Reward Credited: +2.50 USDT',
      messageBody: 'Your task in TonDeFi Early Adopter Vanguard was verified! 2.50 USDT has been credited to your available balance.',
      deepLink: 'https://t.me/NexeraQuestBot/app?startapp=wallet',
      status: 'SENT',
    },
  });

  // 12. Audit Log
  await prisma.auditEvent.create({
    data: {
      actorId: adminUser.id,
      actorRole: 'SUPER_ADMIN',
      action: 'CAMPAIGN_APPROVED',
      entityType: 'CAMPAIGN',
      entityId: campaign1.id,
      previousState: JSON.stringify({ status: 'UNDER_REVIEW' }),
      newState: JSON.stringify({ status: 'LIVE' }),
      metadata: JSON.stringify({ reason: 'Initial seed verification confirmed' }),
    },
  });

  console.log('✅ NexeraQuest Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
