import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@nexeraquest/database';
import { LedgerEngine } from '@nexeraquest/ledger';
import { randomUUID } from 'crypto';

describe('Financial Ledger & Concurrency Safety', () => {
  let testUser: any;
  let testProject: any;
  let testCampaign: any;
  let testTask: any;

  beforeAll(async () => {
    // Setup isolated test entities
    testUser = await prisma.user.create({
      data: {
        telegramId: `test_${Date.now()}`,
        telegramUsername: `test_user_${Date.now()}`,
        firstName: 'Test',
        lastName: 'Contributor',
        role: 'CONTRIBUTOR',
        status: 'ACTIVE',
        trustScore: 70,
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: `Project_${Date.now()}`,
        slug: `proj-${Date.now()}`,
        description: 'Test Project for Ledger',
        verificationStatus: 'VERIFIED',
      },
    });

    testCampaign = await prisma.campaign.create({
      data: {
        projectId: testProject.id,
        title: 'Escrow Test Campaign',
        slug: `escrow-${Date.now()}`,
        description: 'Testing Ledger Locks',
        status: 'FUNDED',
        rewardPerAction: 5.0,
        targetParticipants: 10,
        totalBudget: 57.5,
        platformFee: 7.5,
        lockedBudget: 50.0,
        earnedBudget: 0.0,
        currency: 'USDT',
        tasks: {
          create: {
            title: 'Test Verification Task',
            taskType: 'TELEGRAM_CHANNEL',
            instructions: 'Test instructions',
          },
        },
      },
      include: { tasks: true },
    });

    testTask = testCampaign.tasks[0];
  });

  it('credits task reward transactionally and creates immutable ledger entry', async () => {
    const taskInstance = await prisma.taskInstance.create({
      data: {
        campaignTaskId: testTask.id,
        campaignId: testCampaign.id,
        userId: testUser.id,
        status: 'VERIFYING',
      },
    });

    const idempotencyKey = `idemp_test_rw_${taskInstance.id}`;

    const creditResult = await LedgerEngine.creditTaskReward({
      taskInstanceId: taskInstance.id,
      userId: testUser.id,
      campaignId: testCampaign.id,
      rewardAmount: 5.0,
      idempotencyKey,
    });

    expect(creditResult.success).toBe(true);
    expect(creditResult.newBalance).toBeGreaterThanOrEqual(5.0);

    // Verify task instance state
    const updatedInstance = await prisma.taskInstance.findUnique({
      where: { id: taskInstance.id },
    });
    expect(updatedInstance?.rewardClaimed).toBe(true);
    expect(updatedInstance?.status).toBe('APPROVED');

    // Verify ledger entry
    const entry = await prisma.ledgerEntry.findUnique({
      where: { idempotencyKey },
    });
    expect(entry).not.toBeNull();
    expect(entry?.amount).toBe(5.0);
    expect(entry?.entryType).toBe('REWARD_CREDIT');
  });

  it('strictly prevents duplicate reward credits on replayed requests (Idempotency Invariant)', async () => {
    const instance = await prisma.taskInstance.findFirst({
      where: { userId: testUser.id, campaignId: testCampaign.id },
    });
    expect(instance).not.toBeNull();

    const idempotencyKey = `idemp_test_rw_${instance!.id}`;

    // Attempt second claim with the same idempotency key
    const replayResult = await LedgerEngine.creditTaskReward({
      taskInstanceId: instance!.id,
      userId: testUser.id,
      campaignId: testCampaign.id,
      rewardAmount: 5.0,
      idempotencyKey,
    });

    expect(replayResult.success).toBe(true);
    expect(replayResult.message).toContain('Idempotent');

    // Ensure only 1 ledger entry exists for this key
    const count = await prisma.ledgerEntry.count({
      where: { idempotencyKey },
    });
    expect(count).toBe(1);
  });

  it('prevents double payments when a different idempotency key is attempted on an already claimed task', async () => {
    const instance = await prisma.taskInstance.findFirst({
      where: { userId: testUser.id, campaignId: testCampaign.id },
    });

    const newKey = `forged_new_key_${randomUUID()}`;

    // Should reject because task instance has rewardClaimed === true
    await expect(
      LedgerEngine.creditTaskReward({
        taskInstanceId: instance!.id,
        userId: testUser.id,
        campaignId: testCampaign.id,
        rewardAmount: 5.0,
        idempotencyKey: newKey,
      })
    ).rejects.toThrow('already been claimed');
  });

  it('handles withdrawal pipeline: available balance is safely deducted to pending', async () => {
    const wdIdempotency = `wd_test_${randomUUID()}`;

    const wdResult = await LedgerEngine.requestWithdrawal({
      userId: testUser.id,
      amount: 5.0,
      network: 'TON',
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKU9G86UM3hEHYP2cgP96h22',
      idempotencyKey: wdIdempotency,
    });

    expect(wdResult.success).toBe(true);
    expect(wdResult.withdrawal.amount).toBe(5.0);

    const account = await prisma.balanceAccount.findFirst({
      where: { userId: testUser.id, accountType: 'CONTRIBUTOR', currency: 'USDT' },
    });

    expect(account?.pendingBalance).toBeGreaterThanOrEqual(5.0);
  });

  it('executes reconciliation run and confirms balance consistency', async () => {
    const report = await LedgerEngine.runReconciliation('TEST_SUITE');
    expect(report.status).toBe('PASSED');
    expect(report.discrepanciesFound).toBe(0);
    expect(report.totalChecked).toBeGreaterThan(0);
  });
});
