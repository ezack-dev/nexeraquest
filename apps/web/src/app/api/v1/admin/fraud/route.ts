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
        { user: { telegramId: { contains: q } } },
      ];
    }

    const orderBy: any =
      sort === 'risk' ? { riskScore: 'desc' } : { createdAt: 'desc' };

    const take = PAGE_SIZE + 1;
    const cases = await prisma.fraudCase.findMany({
      where,
      orderBy,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            telegramUsername: true,
            firstName: true,
            status: true,
            trustScore: true,
            createdAt: true,
          },
        },
        signals: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
        },
      },
    });

    const hasMore = cases.length > PAGE_SIZE;
    const page = hasMore ? cases.slice(0, PAGE_SIZE) : cases;

    return jsonSuccess(page, {
      count: page.length,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (err: any) {
    return jsonError(err.message, 'FRAUD_FETCH_ERROR', 500);
  }
}
