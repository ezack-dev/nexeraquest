import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { RATE_LIMITS } from '@nexeraquest/auth/src/ratelimit';
import { jsonSuccess, jsonError, getAuthSession, enforceRateLimit } from '@/lib/api-helper';

const MAX_PROOF_BYTES = 5000;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }
    const limited = enforceRateLimit(req, session.userId, 'proof-submit', RATE_LIMITS.proofSubmit);
    if (limited) return limited;

    const { id: taskInstanceId } = params;
    const body = await req.json();
    const { proofType = 'URL', content, fileUrl, fileSize, mimeType, checksum } = body;

    if (content && content.length > MAX_PROOF_BYTES) {
      return jsonError(`Proof content too large (max ${MAX_PROOF_BYTES} chars).`, 'PROOF_TOO_LARGE', 400);
    }
    if (proofType === 'URL' && content && !/^https?:\/\/.+\..+/.test(content)) {
      return jsonError('Proof URL must be a valid http(s) link.', 'INVALID_PROOF_URL', 400);
    }

    const instance = await prisma.taskInstance.findUnique({
      where: { id: taskInstanceId },
      include: { task: true },
    });

    if (!instance) {
      return jsonError('Task instance not found.', 'NOT_FOUND', 404);
    }

    if (instance.userId !== session.userId) {
      return jsonError('Forbidden. Task belongs to another user.', 'FORBIDDEN', 403);
    }

    if (instance.status === 'APPROVED') {
      return jsonError('Task already approved and reward settled.', 'ALREADY_COMPLETED', 400);
    }

    // Proof-reuse guard: same checksum already submitted by another user
    if (checksum) {
      const reuse = await prisma.proof.findFirst({
        where: { checksum, userId: { not: session.userId } },
        select: { id: true, userId: true },
      });
      if (reuse) {
        const { FraudEngine } = await import('@nexeraquest/fraud');
        await FraudEngine.recordSignal(session.userId, 'PROOF_REUSE', 30, {
          checksum,
          taskInstanceId: instance.id,
        }).catch(() => null);
        return jsonError(
          'This file was already submitted by another account. Duplicate proofs are flagged.',
          'PROOF_REUSE',
          422
        );
      }
    }

    // Upsert Proof
    const proof = await prisma.proof.upsert({
      where: { taskInstanceId: instance.id },
      update: {
        proofType,
        content,
        fileUrl,
        fileSize,
        mimeType,
        checksum,
        submittedAt: new Date(),
      },
      create: {
        taskInstanceId: instance.id,
        userId: session.userId,
        proofType,
        content,
        fileUrl,
        fileSize,
        mimeType,
        checksum,
      },
    });

    const updatedInstance = await prisma.taskInstance.update({
      where: { id: instance.id },
      data: {
        status: 'SUBMISSION_REQUIRED',
        submittedAt: new Date(),
      },
      include: { proof: true, task: true },
    });

    return jsonSuccess({ instance: updatedInstance, proof });
  } catch (err: any) {
    return jsonError(err.message, 'SUBMIT_ERROR', 500);
  }
}
