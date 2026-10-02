import { NextRequest } from 'next/server';
import { LedgerEngine } from '@nexeraquest/ledger';
import { RATE_LIMITS } from '@nexeraquest/auth/src/ratelimit';
import { jsonSuccess, jsonError, getAuthSession, enforceRateLimit } from '@/lib/api-helper';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }
    const limited = enforceRateLimit(req, session.userId, 'withdraw', RATE_LIMITS.withdrawal);
    if (limited) return limited;

    const body = await req.json();
    const { amount, network = 'TON', destinationAddress, idempotencyKey } = body;

    if (!amount || !destinationAddress || !idempotencyKey) {
      return jsonError('Missing required withdrawal parameters (amount, destinationAddress, idempotencyKey).', 'INVALID_PARAMS', 400);
    }

    const safeAmount = Number(amount);
    if (isNaN(safeAmount) || safeAmount <= 0) {
      return jsonError('Invalid withdrawal amount.', 'INVALID_AMOUNT', 400);
    }

    const result = await LedgerEngine.requestWithdrawal({
      userId: session.userId,
      amount: safeAmount,
      network,
      destinationAddress,
      idempotencyKey,
    });

    return jsonSuccess(result);
  } catch (err: any) {
    return jsonError(err.message, 'WITHDRAWAL_FAILED', 400);
  }
}
