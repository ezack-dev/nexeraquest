import { prisma } from './prisma.js';
import { LedgerService } from './services/ledgerService.js';

export async function seedAll({ reset = false }: { reset?: boolean } = {}) {
  console.log('🌱 Starting NexeraQuest database seed...');

  if (reset) {
    await prisma.auditEvent.deleteMany();
    await prisma.fraudCase.deleteMany();
    await prisma.trustEvent.deleteMany();
    await prisma.withdrawal.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.proof.deleteMany();
    await prisma.taskInstance.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.balanceAccount.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing records.');
  }

  // 1. Create Web3 Projects
  const tonVerse = await prisma.project.create({
    data: {
      name: 'TonVerse DEX',
      description: 'The premier decentralized exchange and liquidity hub built natively on TON.',
      website: 'https://tonverse.org',
      telegramChannel: 'https://t.me/tonverse_dex',
      twitterHandle: '@TonVerseDEX',
      contactEmail: 'partners@tonverse.org',
      status: 'APPROVED',
    },
  });

  await prisma.project.create({
    data: {
      name: 'Aptos Nexus',
      description: 'Next-generation decentralized infrastructure and bridging protocols on Aptos.',
      website: 'https://aptosnexus.io',
      twitterHandle: '@AptosNexus',
      contactEmail: 'growth@aptosnexus.io',
      status: 'APPROVED',
    },
  });

  const aptosNexus = await prisma.project.findFirstOrThrow({
    where: { name: 'Aptos Nexus' },
  });

  const nexeraDao = await prisma.project.create({
    data: {
      name: 'Nexera Protocol',
      description: 'Decentralized compliance, identity verification, and on-chain reputation infra.',
      website: 'https://nexera.id',
      telegramChannel: 'https://t.me/nexeraquest',
      twitterHandle: '@NexeraQuest',
      contactEmail: 'team@nexeraquest.io',
      status: 'APPROVED',
    },
  });

  console.log('✅ Created 3 Web3 project sponsors.');

  // 2. Create Campaigns with pre-funded Escrow
  const campaignConfigs = [
    {
      projectId: tonVerse.id,
      title: 'Join TonVerse Official Telegram Channel',
      description: 'Join our official announcements channel and stay updated on TON ecosystem token launches and yield farming pools.',
      category: 'COMMUNITY',
      taskType: 'TELEGRAM_JOIN',
      instructions: '1. Click the link to open the TonVerse Telegram channel.\n2. Tap "Join Channel".\n3. Return here and tap "Verify Membership" for instant credit.',
      externalUrl: 'https://t.me/tonverse_dex',
      rewardPerAction: 0.50,
      targetSlots: 200,
      proofType: 'AUTOMATIC_MEMBERSHIP',
    },
    {
      projectId: aptosNexus.id,
      title: 'Follow & Repost Aptos Nexus Mainnet Announcement',
      description: 'Help amplify our mainnet roadmap! Follow @AptosNexus on X and retweet our pinned announcement thread.',
      category: 'SOCIAL',
      taskType: 'TWITTER_FOLLOW',
      instructions: '1. Follow @AptosNexus on X (Twitter).\n2. Repost the pinned tweet with comment mentioning #NexeraQuest.\n3. Paste your tweet/repost URL below as proof.',
      externalUrl: 'https://x.com/AptosNexus/status/1880000000000000',
      rewardPerAction: 0.75,
      targetSlots: 150,
      proofType: 'LINK_SUBMISSION',
    },
    {
      projectId: nexeraDao.id,
      title: 'NexeraQuest Pioneer Contributor Invite Challenge',
      description: 'Invite your Web3 friends to join NexeraQuest! Earn 1.00 USDT for every friend who signs up and completes their first quest.',
      category: 'GROWTH',
      taskType: 'REFERRAL',
      instructions: '1. Copy your unique referral invite link from your profile.\n2. Share with friends or community groups.\n3. Receive 1.00 USDT credited to your balance when they complete a task.',
      externalUrl: 'https://t.me/nexeraquest_bot',
      rewardPerAction: 1.00,
      targetSlots: 300,
      proofType: 'AUTOMATIC_MEMBERSHIP',
    },
    {
      projectId: tonVerse.id,
      title: 'TonVerse DEX Testnet Swap Feedback & Bug Report',
      description: 'Test our newly deployed testnet router. Connect your testnet wallet, execute a simulated TON/USDT swap, and submit your feedback.',
      category: 'TESTING',
      taskType: 'FEEDBACK',
      instructions: '1. Visit testnet.tonverse.org.\n2. Execute a swap with test tokens.\n3. Submit a detailed report (30+ words) describing your user experience and any UX bugs encountered.',
      externalUrl: 'https://testnet.tonverse.org',
      rewardPerAction: 3.50,
      targetSlots: 40,
      proofType: 'TEXT_RESPONSE',
    },
    {
      projectId: nexeraDao.id,
      title: 'Create Viral Meme or Infographic for NexeraQuest',
      description: 'Create an engaging, high-quality meme or educational graphic explaining why 100% pre-funded escrows are the future of Web3 micro-tasks.',
      category: 'CREATIVE',
      taskType: 'CONTENT_SUBMIT',
      instructions: '1. Design an original graphic or meme.\n2. Post on X tagging @NexeraQuest with #QuestAndEarn.\n3. Submit the link to your post.',
      externalUrl: 'https://x.com/NexeraQuest',
      rewardPerAction: 2.50,
      targetSlots: 50,
      proofType: 'LINK_SUBMISSION',
    },
  ];

  const createdCampaigns = [];

  for (const cfg of campaignConfigs) {
    const rewardPool = Number((cfg.rewardPerAction * cfg.targetSlots).toFixed(2));
    const platformFee = Number((rewardPool * 0.20).toFixed(2));
    const totalCost = Number((rewardPool + platformFee).toFixed(2));

    const campaign = await prisma.campaign.create({
      data: {
        ...cfg,
        rewardPool,
        platformFee,
        totalCost,
        status: 'ACTIVE',
      },
    });

    await LedgerService.recordCampaignDeposit(
      campaign.id,
      rewardPool,
      platformFee,
      `INITIAL_ESCROW_TX_${campaign.id.substring(0, 8)}`
    );

    createdCampaigns.push(campaign);
  }

  console.log(`✅ Created and pre-funded ${createdCampaigns.length} active campaigns in escrow.`);

  // 3. Create Demo Contributors
  const alex = await prisma.user.create({
    data: {
      telegramId: '987654321',
      username: 'alex_web3',
      firstName: 'Alex',
      lastName: 'Rivers',
      trustScore: 76,
      status: 'ACTIVE',
      referralCode: 'NQALEX7',
      balanceAccount: {
        create: {
          available: 0.0,
          pending: 0.0,
          withdrawn: 0.0,
        },
      },
    },
  });

  const sam = await prisma.user.create({
    data: {
      telegramId: '123456789',
      username: 'cryptosam',
      firstName: 'Sam',
      lastName: 'Chen',
      trustScore: 60,
      status: 'ACTIVE',
      referralCode: 'NQSAM88',
      referredById: alex.id,
      balanceAccount: {
        create: {
          available: 0.0,
          pending: 0.0,
          withdrawn: 0.0,
        },
      },
    },
  });

  console.log('✅ Created demo contributors: @alex_web3, @cryptosam.');

  // 4. Simulate completed quests for Alex
  const firstCampaign = createdCampaigns[0];
  const memeCampaign = createdCampaigns[4];

  const alexTask1 = await prisma.taskInstance.create({
    data: {
      campaignId: firstCampaign.id,
      userId: alex.id,
      status: 'APPROVED',
      completedAt: new Date(Date.now() - 7200000),
      proof: {
        create: {
          proofType: 'AUTOMATIC_MEMBERSHIP',
          payload: 'Auto-verified via Telegram API',
          status: 'VERIFIED',
          verifiedAt: new Date(Date.now() - 7200000),
        },
      },
    },
  });

  await prisma.campaign.update({
    where: { id: firstCampaign.id },
    data: { completedSlots: { increment: 1 } },
  });
  await LedgerService.recordRewardCredit(alex.id, firstCampaign.id, alexTask1.id, firstCampaign.rewardPerAction);

  const alexTask2 = await prisma.taskInstance.create({
    data: {
      campaignId: memeCampaign.id,
      userId: alex.id,
      status: 'APPROVED',
      completedAt: new Date(Date.now() - 3600000),
      proof: {
        create: {
          proofType: 'LINK_SUBMISSION',
          payload: 'https://x.com/alex_web3/status/188000123456',
          status: 'VERIFIED',
          verifiedAt: new Date(Date.now() - 3600000),
        },
      },
    },
  });

  await prisma.campaign.update({
    where: { id: memeCampaign.id },
    data: { completedSlots: { increment: 1 } },
  });
  await LedgerService.recordRewardCredit(alex.id, memeCampaign.id, alexTask2.id, memeCampaign.rewardPerAction);

  await prisma.trustEvent.createMany({
    data: [
      {
        userId: alex.id,
        eventType: 'QUEST_APPROVED',
        delta: 2,
        currentScore: 76,
        reason: `Completed quest: ${firstCampaign.title}`,
      },
      {
        userId: alex.id,
        eventType: 'QUEST_APPROVED',
        delta: 2,
        currentScore: 78,
        reason: `Completed quest: ${memeCampaign.title}`,
      },
    ],
  });
  await prisma.user.update({ where: { id: alex.id }, data: { trustScore: 78 } });

  const socialCampaign = createdCampaigns[1];
  const samTask1 = await prisma.taskInstance.create({
    data: {
      campaignId: socialCampaign.id,
      userId: sam.id,
      status: 'APPROVED',
      completedAt: new Date(Date.now() - 5400000),
      proof: {
        create: {
          proofType: 'LINK_SUBMISSION',
          payload: 'https://x.com/cryptosam/status/188000999888',
          status: 'VERIFIED',
          verifiedAt: new Date(Date.now() - 5400000),
        },
      },
    },
  });
  await prisma.campaign.update({
    where: { id: socialCampaign.id },
    data: { completedSlots: { increment: 1 } },
  });
  await LedgerService.recordRewardCredit(sam.id, socialCampaign.id, samTask1.id, socialCampaign.rewardPerAction);
  await prisma.trustEvent.create({
    data: {
      userId: sam.id,
      eventType: 'QUEST_APPROVED',
      delta: 2,
      currentScore: 62,
      reason: `Completed quest: ${socialCampaign.title}`,
    },
  });
  await prisma.user.update({ where: { id: sam.id }, data: { trustScore: 62 } });

  const testingCampaign = createdCampaigns[3];
  await prisma.taskInstance.create({
    data: {
      campaignId: testingCampaign.id,
      userId: sam.id,
      status: 'SUBMITTED',
      proof: {
        create: {
          proofType: 'TEXT_RESPONSE',
          payload: 'Executed swap from 5 TON to 12.5 USDT. The transaction executed in 2.1s. UX recommendation: add price impact slider to swap confirmation modal to prevent slippage on large pools.',
          status: 'PENDING',
        },
      },
    },
  });

  const alexWithdrawal = await prisma.withdrawal.create({
    data: {
      userId: alex.id,
      amount: 1.50,
      currency: 'USDT',
      network: 'TON',
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKUWaFVOTzn0_rum0LN3ERA2',
      status: 'REQUESTED',
    },
  });
  await LedgerService.recordWithdrawalRequest(alex.id, alexWithdrawal.id, 1.50);

  const audit = await LedgerService.auditLedger();
  console.log('\n📊 Financial Audit Verification:');
  console.log(`- Total Deposits in Escrow: ${audit.totalDeposits.toFixed(2)} USDT`);
  console.log(`- Platform Fees: ${audit.totalPlatformFees.toFixed(2)} USDT`);
  console.log(`- Total Rewards Earned: ${audit.totalRewardsEarned.toFixed(2)} USDT`);
  console.log(`- Solvency Balanced: ${audit.isBalanced ? '✅ YES (Zero-Sum Invariant Maintained)' : '❌ NO'}\n`);
}

/**
 * Safely seeds initial demo projects & campaigns on first deploy when database is empty
 */
export async function ensureInitialSeed() {
  try {
    const projectCount = await prisma.project.count();
    if (projectCount === 0) {
      console.log('📦 Empty database detected — initializing NexeraQuest starter campaigns...');
      await seedAll({ reset: false });
    }
  } catch (err) {
    console.warn('⚠️ Initial seed check skipped:', err);
  }
}
