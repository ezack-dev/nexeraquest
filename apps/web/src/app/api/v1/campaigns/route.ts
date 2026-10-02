import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { calculateCampaignEconomics } from '@nexeraquest/config';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'LIVE';
    const sort = searchParams.get('sort') || 'highest_reward';

    const where: any = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'highest_reward') {
      orderBy = { rewardPerAction: 'desc' };
    } else if (sort === 'slots') {
      orderBy = { completedParticipants: 'asc' };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verificationStatus: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            taskType: true,
            actionType: true,
            timerSeconds: true,
            verificationAdapter: true,
          },
        },
      },
    });

    return jsonSuccess(campaigns, { count: campaigns.length });
  } catch (err: any) {
    return jsonError(err.message, 'QUERY_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized project access', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const {
      title,
      description,
      category = 'Community',
      rewardPerAction,
      targetParticipants,
      taskType = 'TELEGRAM_CHANNEL',
      destinationUrl,
      taskInstructions,
      proofRequirements,
      verificationAdapter = 'TELEGRAM_MEMBERSHIP',
      coverUrl,
      minTrustScore = 40,
    } = body;

    if (!title || !rewardPerAction || !targetParticipants) {
      return jsonError('Missing required campaign fields (title, rewardPerAction, targetParticipants)', 'VALIDATION_ERROR', 400);
    }

    // Find project
    let project = await prisma.project.findFirst();
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'My Web3 Protocol',
          slug: `project-${Date.now()}`,
          description: 'Innovative decentralized protocol',
          verificationStatus: 'VERIFIED',
        },
      });
    }

    // Calculate Economics
    const economics = calculateCampaignEconomics(rewardPerAction, targetParticipants);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    // Create Campaign in DRAFT / FUNDING_REQUIRED state
    const campaign = await prisma.campaign.create({
      data: {
        projectId: project.id,
        title,
        slug,
        description: description || 'Complete verified task to earn reward.',
        category,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
        status: 'FUNDING_REQUIRED',
        rewardPerAction: economics.rewardPerAction,
        targetParticipants: economics.targetParticipants,
        totalBudget: economics.totalDeposit,
        platformFee: economics.feeAmount,
        lockedBudget: 0,
        earnedBudget: 0,
        refundableBudget: 0,
        currency: economics.currency,
        verificationType: taskType,
        eligibilityConfig: JSON.stringify({ minTrustScore }),
        tasks: {
          create: {
            title: `Complete: ${title}`,
            taskType,
            actionType: 'COMPLETE_ACTION',
            destinationUrl,
            instructions: taskInstructions || 'Follow requirements to earn verified reward.',
            proofRequirements: proofRequirements || 'Automated verification check.',
            verificationAdapter,
          },
        },
      },
      include: {
        tasks: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        actorId: session.userId,
        actorRole: session.role,
        action: 'CAMPAIGN_CREATED',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        newState: JSON.stringify(campaign),
      },
    });

    return jsonSuccess({ campaign, economics }, undefined, 201);
  } catch (err: any) {
    return jsonError(err.message, 'CREATION_FAILED', 500);
  }
}
