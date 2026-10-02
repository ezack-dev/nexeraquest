import { prisma } from '@nexeraquest/database';
import { FraudSeverity, FraudSignalType } from '@nexeraquest/types';

export interface EvaluatedRisk {
  userId: string;
  riskScore: number;
  severity: FraudSeverity;
  signals: Array<{
    type: FraudSignalType;
    weight: number;
    details: string;
  }>;
  recommendedAction: 'ALLOW' | 'MONITOR' | 'MANUAL_REVIEW' | 'FREEZE';
}

export class FraudEngine {
  /**
   * Evaluates user risk signals based on velocity, submission reuse, failure rates, and anomalies.
   */
  static async evaluateUserRisk(userId: string): Promise<EvaluatedRisk> {
    const signals: Array<{ type: FraudSignalType; weight: number; details: string }> = [];

    // 1. Velocity Analysis: Count tasks completed in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTasksCount = await prisma.taskInstance.count({
      where: {
        userId,
        startedAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentTasksCount >= 8) {
      signals.push({
        type: 'VELOCITY_SPIKE',
        weight: 35,
        details: `Abnormal quest velocity: ${recentTasksCount} tasks attempted within 5 minutes.`,
      });
    } else if (recentTasksCount >= 4) {
      signals.push({
        type: 'VELOCITY_SPIKE',
        weight: 15,
        details: `Elevated quest velocity: ${recentTasksCount} tasks in 5 minutes.`,
      });
    }

    // 2. Repeated Rejection Rate
    const last10Tasks = await prisma.taskInstance.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    if (last10Tasks.length >= 4) {
      const rejectedCount = last10Tasks.filter((t) => t.status === 'REJECTED').length;
      const failureRate = rejectedCount / last10Tasks.length;
      if (failureRate >= 0.6) {
        signals.push({
          type: 'REPEATED_FAILURES',
          weight: 25,
          details: `High failure rate: ${rejectedCount} out of last ${last10Tasks.length} quests rejected.`,
        });
      }
    }

    // 3. Duplicate Proof Content Detection
    const userProofs = await prisma.proof.findMany({
      where: { userId },
      take: 5,
    });

    for (const proof of userProofs) {
      if (proof.content && proof.content.trim().length > 15) {
        const duplicateMatches = await prisma.proof.findMany({
          where: {
            content: proof.content,
            userId: { not: userId },
          },
        });
        if (duplicateMatches.length > 0) {
          signals.push({
            type: 'PROOF_REUSE',
            weight: 40,
            details: `Proof content re-used across multiple distinct accounts (${duplicateMatches.length} collisions).`,
          });
          break;
        }
      }
    }

    // 4. Referral Loop or Self-Referral Detection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { refereeProfile: true },
    });

    if (user && user.referredById) {
      // Check if referrer was referred by this user (2-node cycle)
      const referrer = await prisma.user.findUnique({
        where: { id: user.referredById },
      });
      if (referrer && referrer.referredById === user.id) {
        signals.push({
          type: 'REFERRAL_LOOP',
          weight: 45,
          details: `Cyclic referral detected between user ${user.id} and ${referrer.id}.`,
        });
      }
    }

    // 5. Calculate Total Risk Score (capped at 100)
    const rawScore = signals.reduce((acc, s) => acc + s.weight, 0);
    const riskScore = Math.min(100, Math.max(0, rawScore));

    let severity: FraudSeverity = 'LOW';
    let recommendedAction: 'ALLOW' | 'MONITOR' | 'MANUAL_REVIEW' | 'FREEZE' = 'ALLOW';

    if (riskScore >= 80) {
      severity = 'CRITICAL';
      recommendedAction = 'FREEZE';
    } else if (riskScore >= 60) {
      severity = 'HIGH';
      recommendedAction = 'MANUAL_REVIEW';
    } else if (riskScore >= 30) {
      severity = 'MEDIUM';
      recommendedAction = 'MONITOR';
    }

    // If High or Critical risk, ensure FraudCase is opened
    if (riskScore >= 50) {
      const existingCase = await prisma.fraudCase.findFirst({
        where: {
          userId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      });

      if (!existingCase) {
        const newCase = await prisma.fraudCase.create({
          data: {
            userId,
            riskScore,
            severity,
            status: 'OPEN',
            resolutionNotes: `Auto-flagged by FraudEngine with score ${riskScore}. Signals: ${signals.map((s) => s.type).join(', ')}`,
          },
        });

        for (const sig of signals) {
          await prisma.fraudSignal.create({
            data: {
              fraudCaseId: newCase.id,
              userId,
              signalType: sig.type,
              weight: sig.weight,
              details: sig.details,
            },
          });
        }
      }
    }

    return {
      userId,
      riskScore,
      severity,
      signals,
      recommendedAction,
    };
  }

  /**
   * Records a single ad-hoc fraud signal, opening a case when the
   * accumulated open-case score crosses the review threshold.
   */
  static async recordSignal(
    userId: string,
    signalType: FraudSignalType,
    weight: number,
    details: Record<string, any> | string
  ) {
    const detailStr = typeof details === 'string' ? details : JSON.stringify(details);
    let openCase = await prisma.fraudCase.findFirst({
      where: { userId, status: { in: ['OPEN', 'INVESTIGATING'] } },
    });
    if (!openCase) {
      openCase = await prisma.fraudCase.create({
        data: { userId, riskScore: weight, severity: weight >= 30 ? 'MEDIUM' : 'LOW', status: 'OPEN' },
      });
    } else {
      const next = Math.min(100, openCase.riskScore + weight);
      await prisma.fraudCase.update({
        where: { id: openCase.id },
        data: { riskScore: next, severity: next >= 80 ? 'CRITICAL' : next >= 60 ? 'HIGH' : next >= 30 ? 'MEDIUM' : 'LOW' },
      });
    }
    return prisma.fraudSignal.create({
      data: { fraudCaseId: openCase.id, userId, signalType, weight, details: detailStr },
    });
  }

  /**
   * Administrative Action: Freeze Contributor Account
   */
  static async freezeContributor(userId: string, reason: string, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: adminId,
        actorRole: 'RISK_ADMIN',
        action: 'CONTRIBUTOR_SUSPENDED',
        entityType: 'USER',
        entityId: userId,
        metadata: JSON.stringify({ reason }),
      },
    });

    return user;
  }

  /**
   * Administrative Action: Unfreeze Contributor Account
   */
  static async unfreezeContributor(userId: string, reason: string, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: adminId,
        actorRole: 'RISK_ADMIN',
        action: 'CONTRIBUTOR_ACTIVATED',
        entityType: 'USER',
        entityId: userId,
        metadata: JSON.stringify({ reason }),
      },
    });

    return user;
  }

  /**
   * Resolve an open fraud case
   */
  static async resolveFraudCase(caseId: string, resolution: 'DISMISSED' | 'CONFIRMED' | 'RESOLVED', notes: string, adminId: string) {
    const resolved = await prisma.fraudCase.update({
      where: { id: caseId },
      data: {
        status: resolution,
        resolvedBy: adminId,
        resolutionNotes: notes,
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: adminId,
        actorRole: 'RISK_ADMIN',
        action: `FRAUD_CASE_${resolution}`,
        entityType: 'FRAUD_CASE',
        entityId: caseId,
        metadata: JSON.stringify({ notes }),
      },
    });

    return resolved;
  }
}
