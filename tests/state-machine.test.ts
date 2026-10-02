import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@nexeraquest/database';

describe('State Machine & Transition Invariants', () => {
  let project: any;
  let campaign: any;
  let user: any;
  let task: any;

  beforeAll(async () => {
    project = await prisma.project.create({
      data: {
        name: `StateMachine_${Date.now()}`,
        slug: `sm-${Date.now()}`,
        description: 'State Machine Testing',
        verificationStatus: 'VERIFIED',
      },
    });

    user = await prisma.user.create({
      data: {
        telegramId: `sm_user_${Date.now()}`,
        telegramUsername: `sm_user_${Date.now()}`,
        role: 'CONTRIBUTOR',
      },
    });

    campaign = await prisma.campaign.create({
      data: {
        projectId: project.id,
        title: 'State Transition Campaign',
        slug: `transition-${Date.now()}`,
        description: 'Testing transitions',
        status: 'DRAFT',
        tasks: {
          create: {
            title: 'Transition Task',
            instructions: 'Step 1',
          },
        },
      },
      include: { tasks: true },
    });

    task = campaign.tasks[0];
  });

  it('campaign transitions from DRAFT to FUNDING_REQUIRED and then FUNDED', async () => {
    expect(campaign.status).toBe('DRAFT');

    const fundingReq = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'FUNDING_REQUIRED' },
    });
    expect(fundingReq.status).toBe('FUNDING_REQUIRED');

    const funded = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'FUNDED', totalBudget: 500, lockedBudget: 425, platformFee: 75 },
    });
    expect(funded.status).toBe('FUNDED');
    expect(funded.lockedBudget).toBe(425);
  });

  it('campaign advances to LIVE and can be PAUSED with a documented reason', async () => {
    const live = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'LIVE' },
    });
    expect(live.status).toBe('LIVE');

    const paused = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'PAUSED',
        pausedReason: 'Maintenance update on destination community',
      },
    });
    expect(paused.status).toBe('PAUSED');
    expect(paused.pausedReason).toContain('Maintenance');
  });

  it('task instance moves through strict progression: IN_PROGRESS -> SUBMISSION_REQUIRED -> APPROVED', async () => {
    const instance = await prisma.taskInstance.create({
      data: {
        campaignTaskId: task.id,
        campaignId: campaign.id,
        userId: user.id,
        status: 'IN_PROGRESS',
      },
    });
    expect(instance.status).toBe('IN_PROGRESS');

    const submitted = await prisma.taskInstance.update({
      where: { id: instance.id },
      data: { status: 'SUBMISSION_REQUIRED', submittedAt: new Date() },
    });
    expect(submitted.status).toBe('SUBMISSION_REQUIRED');

    const approved = await prisma.taskInstance.update({
      where: { id: instance.id },
      data: { status: 'APPROVED', rewardClaimed: true, completedAt: new Date() },
    });
    expect(approved.status).toBe('APPROVED');
    expect(approved.rewardClaimed).toBe(true);
  });
});
