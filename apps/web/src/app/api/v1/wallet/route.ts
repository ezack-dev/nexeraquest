import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return jsonError('Unauthorized access.', 'UNAUTHORIZED', 401);
    }

    // Contributor Balance Account
    let account = await prisma.balanceAccount.findFirst({
      where: { userId: session.userId, accountType: 'CONTRIBUTOR', currency: 'USDT' },
    });

    if (!account) {
      account = await prisma.balanceAccount.create({
        data: {
          userId: session.userId,
          accountType: 'CONTRIBUTOR',
          currency: 'USDT',
          availableBalance: 0,
          pendingBalance: 0,
          reservedBalance: 0,
          paidBalance: 0,
        },
      });
    }

    // Ledger transactions involving this account
    const transactions = await prisma.ledgerEntry.findMany({
      where: {
        OR: [
          { sourceAccountId: account.id },
          { destinationAccountId: account.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Active withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.userId },
      orderBy: { requestedAt: 'desc' },
      take: 10,
    });

    const totalEarned = Number((account.availableBalance + account.pendingBalance + account.paidBalance).toFixed(4));

    return jsonSuccess({
      balance: {
        available: account.availableBalance,
        pending: account.pendingBalance,
        reserved: account.reservedBalance,
        paid: account.paidBalance,
        totalEarned,
        currency: account.currency,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        transactionId: t.transactionId,
        type: t.entryType,
        amount: t.destinationAccountId === account?.id ? t.amount : -t.amount,
        currency: t.currency,
        referenceNote: t.referenceNote,
        createdAt: t.createdAt,
      })),
      withdrawals,
    });
  } catch (err: any) {
    return jsonError(err.message, 'WALLET_FETCH_ERROR', 500);
  }
}
