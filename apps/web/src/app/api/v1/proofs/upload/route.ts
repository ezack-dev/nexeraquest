import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { storeProofFile } from '@nexeraquest/storage';
import { RATE_LIMITS } from '@nexeraquest/auth/src/ratelimit';
import { jsonSuccess, jsonError, getAuthSession, enforceRateLimit } from '@/lib/api-helper';

/**
 * Multipart proof file upload. Accepts a single `file` field.
 * Query/body must include taskInstanceId the file belongs to.
 * Returns fileUrl + checksum; caller then submits proof referencing it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    const limited = enforceRateLimit(req, session.userId, 'proof-upload', RATE_LIMITS.proofSubmit);
    if (limited) return limited;

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const taskInstanceId = String(form.get('taskInstanceId') || '');

    if (!file || !taskInstanceId) {
      return jsonError('Missing file or taskInstanceId.', 'INVALID_PARAMS', 400);
    }

    const instance = await prisma.taskInstance.findUnique({ where: { id: taskInstanceId } });
    if (!instance) return jsonError('Task instance not found.', 'NOT_FOUND', 404);
    if (instance.userId !== session.userId) {
      return jsonError('Forbidden. Task belongs to another user.', 'FORBIDDEN', 403);
    }
    if (instance.status === 'APPROVED') {
      return jsonError('Task already approved.', 'ALREADY_COMPLETED', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeProofFile(buffer, file.type || 'application/octet-stream', taskInstanceId);

    return jsonSuccess(stored);
  } catch (err: any) {
    return jsonError(err.message, 'UPLOAD_FAILED', (err as any).status || 500);
  }
}
