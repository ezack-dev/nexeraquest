import { NextResponse } from 'next/server';
import { prisma } from '@nexeraquest/database';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const campaignCount = await prisma.campaign.count();
    const ledgerCount = await prisma.ledgerEntry.count();

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'NexeraQuest API v1',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        stats: {
          users: userCount,
          campaigns: campaignCount,
          ledgerEntries: ledgerCount,
        },
      },
      ledger: {
        doubleEntryEnforced: true,
        reconciliationActive: true,
      },
      features: {
        telegramVerification: true,
        proofReview: true,
        sandboxSimulation: process.env.SANDBOX_MODE === 'true',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
