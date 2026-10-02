import { NextRequest } from 'next/server';
import { FraudEngine } from '@nexeraquest/fraud';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'fraud:resolve');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const { id: caseId } = params;
    const body = await req.json();
    const { resolution = 'RESOLVED', notes = '' } = body;

    const resolved = await FraudEngine.resolveFraudCase(
      caseId,
      resolution as any,
      notes,
      session?.userId || 'ADMIN'
    );

    return jsonSuccess(resolved);
  } catch (err: any) {
    return jsonError(err.message, 'FRAUD_RESOLVE_ERROR', 500);
  }
}
