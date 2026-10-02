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
        { title: { contains: q } },
        { project: { name: { contains: q } } },
      ];
    }

    const orderBy: any =
      sort === 'budget' ? { totalBudget: 'desc' } :
      sort === 'progress' ? { completedParticipants: 'desc' } :
      { createdAt: 'desc' };

    const take = PAGE_SIZE + 1;
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
      include: {
        project: { select: { id: true, name: true, logoUrl: true } },
        tasks: { take: 1 },
      },
    });

    const hasMore = campaigns.length > PAGE_SIZE;
    const page = hasMore ? campaigns.slice(0, PAGE_SIZE) : campaigns;

    return jsonSuccess(page, {
      count: page.length,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (err: any) {
    return jsonError(err.message, 'ADMIN_CAMPAIGNS_ERROR', 500);
  }
}
