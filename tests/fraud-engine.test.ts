import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@nexeraquest/database';
import { FraudEngine } from '@nexeraquest/fraud';

describe('Fraud & Sybil Intelligence Engine', () => {
  let botUser: any;
  let testCampaign: any;
  let testTask: any;

  beforeAll(async () => {
    botUser = await prisma.user.create({
      data: {
        telegramId: `bot_${Date.now()}`,
        telegramUsername: `spambot_${Date.now()}`,
        firstName: 'Bot',
        role: 'CONTRIBUTOR',
        status: 'ACTIVE',
        trustScore: 40,
      },
    });

    const project = await prisma.project.findFirst();
    testCampaign = await prisma.campaign.findFirst({
      where: { projectId: project?.id },
      include: { tasks: true },
    });
    testTask = testCampaign.tasks[0];
  });

  it('evaluates normal user with low risk score', async () => {
    const risk = await FraudEngine.evaluateUserRisk(botUser.id);
    expect(risk.riskScore).toBeLessThan(50);
    expect(risk.recommendedAction).toBe('ALLOW');
  });

  it('detects velocity spikes when multiple tasks are created rapidly', async () => {
    // Simulate 5 tasks in 1 minute
    for (let i = 0; i < 5; i++) {
      const extraTask = await prisma.campaignTask.create({
        data: {
          campaignId: testCampaign.id,
          title: `Rapid Task ${i}_${Date.now()}`,
          instructions: 'Rapid test',
        },
      });
      await prisma.taskInstance.create({
        data: {
          campaignTaskId: extraTask.id,
          campaignId: testCampaign.id,
          userId: botUser.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
    }

    const risk = await FraudEngine.evaluateUserRisk(botUser.id);
    const hasVelocity = risk.signals.some((s) => s.type === 'VELOCITY_SPIKE');
    expect(hasVelocity).toBe(true);
    expect(risk.riskScore).toBeGreaterThan(0);
  });

  it('allows operators to freeze and unfreeze suspicious contributors with audit logs', async () => {
    // Freeze
    const frozen = await FraudEngine.freezeContributor(botUser.id, 'Sybil cluster detected', 'TEST_ADMIN');
    expect(frozen.status).toBe('SUSPENDED');

    // Unfreeze
    const unfrozen = await FraudEngine.unfreezeContributor(botUser.id, 'Appealed and verified genuine', 'TEST_ADMIN');
    expect(unfrozen.status).toBe('ACTIVE');

    // Verify audit log exists
    const audit = await prisma.auditEvent.findFirst({
      where: { entityId: botUser.id, action: 'CONTRIBUTOR_ACTIVATED' },
    });
    expect(audit).not.toBeNull();
  });
});
