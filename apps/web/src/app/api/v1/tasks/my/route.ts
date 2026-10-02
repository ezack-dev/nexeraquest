import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'active', 'completed', 'disputed'

    const where: any = { userId: session.userId };
    if (filter === 'completed') {
      where.status = 'APPROVED';
    } else if (filter === 'active') {
      where.status = { in: ['IN_PROGRESS', 'SUBMISSION_REQUIRED', 'VERIFYING'] };
    } else if (filter === 'disputed') {
      where.status = { in: ['DISPUTED', 'REJECTED'] };
    }

    const tasks = await prisma.taskInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        task: true,
        campaign: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                verificationStatus: true,
              },
            },
          },
        },
        proof: true,
      },
    });

    return jsonSuccess(tasks);
  } catch (err: any) {
    return jsonError(err.message, 'FETCH_TASKS_ERROR', 500);
  }
}
