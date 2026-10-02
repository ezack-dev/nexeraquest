import { NextRequest } from 'next/server';
import { FraudEngine } from '@nexeraquest/fraud';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'contributor:freeze');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const body = await req.json();
    const { userId, action = 'FREEZE', reason = 'Admin risk mitigation' } = body;

    let user;
    if (action === 'FREEZE') {
      user = await FraudEngine.freezeContributor(userId, reason, session?.userId || 'ADMIN');
    } else {
      user = await FraudEngine.unfreezeContributor(userId, reason, session?.userId || 'ADMIN');
    }

    return jsonSuccess({ user, action });
  } catch (err: any) {
    return jsonError(err.message, 'FREEZE_ACTION_ERROR', 500);
  }
}
