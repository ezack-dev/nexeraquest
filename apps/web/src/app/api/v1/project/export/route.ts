import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { getAuthSession } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const project = await prisma.project.findFirst();
    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const where: any = {
      campaign: { projectId: project.id },
    };
    if (campaignId) {
      where.campaignId = campaignId;
    }

    const instances = await prisma.taskInstance.findMany({
      where,
      include: {
        task: true,
        campaign: true,
        user: true,
        proof: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    // Record ExportJob for audit integrity
    await prisma.exportJob.create({
      data: {
        projectId: project.id,
        exportedBy: session?.userId || 'OPERATOR',
        exportType: 'PARTICIPANTS_CSV',
        recordCount: instances.length,
        status: 'COMPLETED',
      },
    });

    // Build CSV with privacy safeguards (no internal fraud scores or private keys)
    const headers = [
      'TaskInstanceId',
      'CampaignTitle',
      'TaskTitle',
      'TelegramUsername',
      'Status',
      'Reward',
      'Currency',
      'StartedAt',
      'CompletedAt',
      'ProofContent',
    ];

    const rows = instances.map((inst) => [
      `"${inst.id}"`,
      `"${inst.campaign.title.replace(/"/g, '""')}"`,
      `"${inst.task.title.replace(/"/g, '""')}"`,
      `"${inst.user.telegramUsername || inst.user.telegramId || 'Anonymous'}"`,
      `"${inst.status}"`,
      inst.campaign.rewardPerAction,
      `"${inst.campaign.currency}"`,
      `"${inst.startedAt.toISOString()}"`,
      `"${inst.completedAt ? inst.completedAt.toISOString() : ''}"`,
      `"${(inst.proof?.content || inst.proof?.fileUrl || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nexeraquest_participants_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(`Export failed: ${err.message}`, { status: 500 });
  }
}
