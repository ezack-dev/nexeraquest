import { prisma } from '@nexeraquest/database';
import { FraudEngine } from '@nexeraquest/fraud';

async function runWorker() {
  console.log('🛡️ [Worker:Fraud] Scanning active contributors for suspicious velocity and sybil patterns...');
  try {
    // Fetch users with recent task submissions in last 1 hour
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentTasks = await prisma.taskInstance.findMany({
      where: { startedAt: { gte: oneHourAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });

    console.log(`🛡️ [Worker:Fraud] Found ${recentTasks.length} active contributors to evaluate.`);

    for (const { userId } of recentTasks) {
      const risk = await FraudEngine.evaluateUserRisk(userId);
      if (risk.riskScore >= 50) {
        console.warn(`⚠️ [Worker:Fraud] High risk detected for user ${userId}: Score ${risk.riskScore}, Recommended: ${risk.recommendedAction}`);
      }
    }

    console.log('✅ [Worker:Fraud] Fraud analysis cycle complete.');
  } catch (err: any) {
    console.error('❌ [Worker:Fraud] Execution error:', err.message);
  }
}

if (require.main === module) {
  runWorker().then(() => process.exit(0));
}

export { runWorker };
