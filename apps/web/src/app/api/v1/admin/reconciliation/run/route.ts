import { NextRequest } from 'next/server';
import { LedgerEngine } from '@nexeraquest/ledger';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'reconciliation:run');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const report = await LedgerEngine.runReconciliation(session?.userId || 'ADMIN_OPERATOR');
    return jsonSuccess(report);
  } catch (err: any) {
    return jsonError(err.message, 'RECONCILIATION_ERROR', 500);
  }
}
