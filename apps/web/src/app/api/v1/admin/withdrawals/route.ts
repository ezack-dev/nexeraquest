import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.trim() || '';
    const sort = searchParams.get('sort') || 'newest';
    const cursor = searchParams.get('cursor') || undefined;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { user: { telegramUsername: { contains: q } } },
        { destinationAddress: { contains: q } },
      ];
    }

    const orderBy: any =
      sort === 'amount' ? { amount: 'desc' } : { requestedAt: 'desc' };

    const take = PAGE_SIZE + 1;
    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
      include: {
        user: {
          select: {
            id: true,
            telegramUsername: true,
            firstName: true,
            trustScore: true,
            status: true,
          },
        },
      },
    });

    const hasMore = withdrawals.length > PAGE_SIZE;
    const page = hasMore ? withdrawals.slice(0, PAGE_SIZE) : withdrawals;

    return jsonSuccess(page, {
      count: page.length,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (err: any) {
    return jsonError(err.message, 'WITHDRAWALS_FETCH_ERROR', 500);
  }
}
