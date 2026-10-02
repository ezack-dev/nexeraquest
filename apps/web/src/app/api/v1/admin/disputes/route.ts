import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            telegramUsername: true,
            trustScore: true,
          },
        },
        taskInstance: {
          include: {
            task: true,
            campaign: true,
            proof: true,
            attempts: true,
          },
        },
      },
    });

    return jsonSuccess(disputes, { count: disputes.length });
  } catch (err: any) {
    return jsonError(err.message, 'DISPUTES_FETCH_ERROR', 500);
  }
}
