import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError } from '@/lib/api-helper';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        project: true,
        tasks: true,
      },
    });

    if (!campaign) {
      return jsonError(`Campaign "${id}" not found.`, 'NOT_FOUND', 404);
    }

    return jsonSuccess(campaign);
  } catch (err: any) {
    return jsonError(err.message, 'QUERY_ERROR', 500);
  }
}
