import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const q = searchParams.get('q')?.trim() || '';
    const cursor = searchParams.get('cursor') || undefined;

    const where: any = {};
    if (type && type !== 'ALL') {
      where.entryType = type;
    }
    if (q) {
      where.OR = [
        { transactionId: { contains: q } },
        { referenceNote: { contains: q } },
      ];
    }

    const take = PAGE_SIZE + 1;
    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
      select: {
        id: true,
        transactionId: true,
        amount: true,
        currency: true,
        entryType: true,
        campaignId: true,
        referenceNote: true,
        createdAt: true,
      },
    });

    const hasMore = entries.length > PAGE_SIZE;
    const page = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

    return jsonSuccess(page, {
      count: page.length,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (err: any) {
    return jsonError(err.message, 'LEDGER_FETCH_ERROR', 500);
  }
}
