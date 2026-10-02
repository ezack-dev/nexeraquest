import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (campaignId) {
      where.campaignId = campaignId;
    }
    if (search && search.trim().length > 0) {
      where.user = {
        OR: [
          { telegramUsername: { contains: search } },
          { firstName: { contains: search } },
          { telegramId: { contains: search } },
        ],
      };
    }

    const participants = await prisma.taskInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        task: true,
        campaign: {
          select: {
            id: true,
            title: true,
            currency: true,
            rewardPerAction: true,
          },
        },
        user: {
          select: {
            id: true,
            telegramId: true,
            telegramUsername: true,
            firstName: true,
            trustScore: true,
            status: true,
          },
        },
        proof: true,
      },
    });

    return jsonSuccess(participants, { count: participants.length });
  } catch (err: any) {
    return jsonError(err.message, 'PARTICIPANTS_FETCH_ERROR', 500);
  }
}
