import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const logs = await prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return jsonSuccess(logs, { count: logs.length });
  } catch (err: any) {
    return jsonError(err.message, 'AUDIT_FETCH_ERROR', 500);
  }
}
