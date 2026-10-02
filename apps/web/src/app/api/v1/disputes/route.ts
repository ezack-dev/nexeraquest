import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

/**
 * Contributor opens a dispute (appeal) on their own task instance.
 * Only the owning user can appeal, and only once per task.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);

    const body = await req.json();
    const { taskInstanceId, reason } = body;
    if (!taskInstanceId || !reason?.trim()) {
      return jsonError('Task and appeal reason are required.', 'INVALID_PARAMS', 400);
    }

    const instance = await prisma.taskInstance.findUnique({
      where: { id: taskInstanceId },
      include: { campaign: true },
    });
    if (!instance) return jsonError('Task not found.', 'NOT_FOUND', 404);
    if (instance.userId !== session.userId) {
      return jsonError('Forbidden. Task belongs to another user.', 'FORBIDDEN', 403);
    }
    if (instance.status !== 'REJECTED') {
      return jsonError('Only rejected tasks can be appealed.', 'INVALID_STATE', 422);
    }

    const existing = await prisma.dispute.findFirst({
      where: { taskInstanceId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'EVIDENCE_REQUESTED'] } },
    });
    if (existing) {
      return jsonError('An appeal is already open for this task.', 'DUPLICATE_DISPUTE', 409);
    }

    const dispute = await prisma.dispute.create({
      data: {
        taskInstanceId,
        userId: session.userId,
        projectId: instance.campaign.projectId,
        initiatedBy: 'CONTRIBUTOR',
        reason: reason.trim().slice(0, 2000),
        status: 'UNDER_REVIEW',
      },
    });

    await prisma.taskInstance.update({
      where: { id: taskInstanceId },
      data: { status: 'DISPUTED' },
    });

    return jsonSuccess({ dispute });
  } catch (err: any) {
    return jsonError(err.message, 'DISPUTE_CREATE_ERROR', 500);
  }
}
