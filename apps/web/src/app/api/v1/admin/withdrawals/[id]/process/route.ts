import { NextRequest } from 'next/server';
import { LedgerEngine } from '@nexeraquest/ledger';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission(req, 'withdrawal:authorize');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const { id: withdrawalId } = params;
    const body = await req.json();
    const { action = 'PAY', txHash, reason } = body; // 'PAY' or 'REJECT'

    if (action === 'PAY') {
      const result = await LedgerEngine.finalizeWithdrawalPayout(
        withdrawalId,
        txHash,
        session?.userId || 'ADMIN'
      );
      return jsonSuccess(result);
    } else {
      // Reject withdrawal: return pending balance back to available balance
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
      });
      if (!withdrawal) {
        return jsonError('Withdrawal not found.', 'NOT_FOUND', 404);
      }

      await prisma.$transaction(async (tx) => {
        await tx.balanceAccount.update({
          where: { id: withdrawal.balanceAccountId },
          data: {
            pendingBalance: { decrement: withdrawal.amount },
            availableBalance: { increment: withdrawal.amount },
          },
        });

        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            failureReason: reason || 'Rejected by Admin Operator',
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionId: `tx_adj_${Date.now()}`,
            sourceAccountId: withdrawal.balanceAccountId,
            destinationAccountId: withdrawal.balanceAccountId,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            entryType: 'ADJUSTMENT',
            withdrawalId: withdrawal.id,
            idempotencyKey: `idemp_rej_${withdrawal.id}`,
            referenceNote: `Withdrawal ${withdrawal.id} rejected: ${reason || 'Operator rejected'}`,
          },
        });
      });

      return jsonSuccess({ success: true, message: 'Withdrawal rejected and balance restored.' });
    }
  } catch (err: any) {
    return jsonError(err.message, 'WITHDRAWAL_PROCESS_ERROR', 500);
  }
}
