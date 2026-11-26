import { prisma } from '../prisma.js';

export class TrustService {
  /**
   * Applies reputation score adjustment and records TrustEvent
   */
  static async adjustTrustScore(
    userId: string,
    eventType: 'QUEST_APPROVED' | 'PROOF_REJECTED' | 'FRAUD_FLAG' | 'REFERRAL_BONUS',
    delta: number,
    reason: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newScore = Math.min(100, Math.max(0, user.trustScore + delta));

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: newScore,
        status: newScore <= 20 ? 'FROZEN' : user.status,
      },
    });

    // Record TrustEvent
    await prisma.trustEvent.create({
      data: {
        userId,
        eventType,
        delta,
        currentScore: newScore,
        reason,
      },
    });

    // If score dropped drastically, flag a fraud case
    if (newScore <= 20 && user.status !== 'FROZEN') {
      await prisma.fraudCase.create({
        data: {
          subjectType: 'USER',
          subjectId: userId,
          severity: 'HIGH',
          signals: JSON.stringify(['CRITICAL_TRUST_SCORE_DROP', reason]),
          notes: `Automated freeze triggered. Score dropped to ${newScore}.`,
        },
      });
    }

    return updatedUser;
  }

  /**
   * Evaluates velocity check (anti-bot rate limit)
   */
  static async checkVelocity(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentStarts = await prisma.taskInstance.count({
      where: {
        userId,
        startedAt: { gte: tenMinutesAgo },
      },
    });

    if (recentStarts >= 8) {
      return {
        allowed: false,
        reason: 'Velocity limit exceeded: max 8 task attempts per 10 minutes. Please slow down.',
      };
    }

    return { allowed: true };
  }

  /**
   * Checks for duplicate proof submissions across all users
   */
  static async checkDuplicateProof(payload: string): Promise<boolean> {
    if (!payload || payload.trim().length < 5) return false;
    const existing = await prisma.proof.findFirst({
      where: {
        payload: payload.trim(),
        status: 'VERIFIED',
      },
    });
    return !!existing;
  }

  /**
   * Traverses referral ancestors to prevent self-referrals and cyclic referral loops (A -> B -> A)
   */
  static async checkReferralCycle(userId: string, proposedReferrerId: string): Promise<boolean> {
    if (userId === proposedReferrerId) return true;

    const visited = new Set<string>([userId]);
    let currentId: string | null = proposedReferrerId;

    while (currentId) {
      if (visited.has(currentId)) {
        return true; // Cycle detected
      }
      visited.add(currentId);

      const parent: { referredById: string | null } | null = await prisma.user.findUnique({
        where: { id: currentId },
        select: { referredById: true },
      });
      currentId = parent?.referredById ?? null;
    }

    return false;
  }
}
