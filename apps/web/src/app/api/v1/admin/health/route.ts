import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { queueDepths } from '@nexeraquest/queue';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'audit:read');
  if ('error' in auth) return auth.error;
  try {
    const checks: Record<string, { ok: boolean; detail?: string; latencyMs?: number }> = {};

    // Database
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, latencyMs: Date.now() - dbStart };
    } catch (err: any) {
      checks.database = { ok: false, detail: err.message };
    }

    // Queue depths (in-memory; Redis when REDIS_URL set)
    const depths = queueDepths();
    const totalQueued = Object.values(depths).reduce((a, b) => a + b, 0);
    checks.queue = {
      ok: totalQueued < 1000,
      detail: process.env.REDIS_URL ? `redis-backed, ${totalQueued} queued` : `in-memory fallback, ${totalQueued} queued`,
    };

    // Providers
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    checks.telegram = {
      ok: Boolean(botToken && botToken.length > 10),
      detail: botToken ? 'bot token configured' : 'TELEGRAM_BOT_TOKEN missing — membership checks return UNAVAILABLE',
    };
    const storage = process.env.STORAGE_PROVIDER || 'local';
    checks.storage = { ok: true, detail: `provider: ${storage}` };

    // Verification freshness: pending attempts older than 15 min
    const stale = await prisma.verificationAttempt.count({
      where: { status: 'PENDING', verifiedAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    checks.verification = { ok: stale < 50, detail: `${stale} stale pending attempts` };

    // Reconciliation freshness
    const latest = await prisma.reconciliationRun.findFirst({ orderBy: { createdAt: 'desc' } });
    const ageHrs = latest ? (Date.now() - latest.createdAt.getTime()) / 3600000 : Infinity;
    checks.reconciliation = {
      ok: latest?.status === 'PASSED' && ageHrs < 24,
      detail: latest ? `${latest.status} ${ageHrs.toFixed(1)}h ago` : 'never run',
    };

    const allOk = Object.values(checks).every((c) => c.ok);
    return jsonSuccess({ healthy: allOk, checks, queues: depths });
  } catch (err: any) {
    return jsonError(err.message, 'HEALTH_ERROR', 500);
  }
}
