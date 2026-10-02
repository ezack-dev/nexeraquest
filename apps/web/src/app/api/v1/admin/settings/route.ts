import { NextRequest } from 'next/server';
import { prisma } from '@nexeraquest/database';
import { jsonSuccess, jsonError, requirePermission } from '@/lib/api-helper';

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'settings:read');
  if ('error' in auth) return auth.error;
  try {
    const pricingRules = await prisma.pricingRule.findMany({ orderBy: { createdAt: 'desc' } });
    const featureFlags = await prisma.featureFlag.findMany();
    const systemSettings = await prisma.systemSetting.findMany();

    return jsonSuccess({
      pricingRules,
      featureFlags,
      systemSettings,
    });
  } catch (err: any) {
    return jsonError(err.message, 'SETTINGS_FETCH_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'settings:read');
  if ('error' in auth) return auth.error;
  try {
    const session = auth.session;
    const body = await req.json();
    const { pricingRule, featureFlagToggle } = body;

    if (pricingRule) {
      const updated = await prisma.pricingRule.update({
        where: { id: pricingRule.id },
        data: {
          feePercentage: pricingRule.feePercentage,
          minimumFee: pricingRule.minimumFee,
        },
      });

      await prisma.auditEvent.create({
        data: {
          actorId: session?.userId || 'ADMIN',
          actorRole: 'SUPER_ADMIN',
          action: 'PRICING_RULE_UPDATED',
          entityType: 'PRICING_RULE',
          entityId: updated.id,
          newState: JSON.stringify(updated),
        },
      });

      return jsonSuccess({ pricingRule: updated });
    }

    if (featureFlagToggle) {
      const updatedFlag = await prisma.featureFlag.update({
        where: { key: featureFlagToggle.key },
        data: { isEnabled: featureFlagToggle.isEnabled },
      });

      await prisma.auditEvent.create({
        data: {
          actorId: session?.userId || 'ADMIN',
          actorRole: 'SUPER_ADMIN',
          action: 'FEATURE_FLAG_TOGGLED',
          entityType: 'FEATURE_FLAG',
          entityId: updatedFlag.key,
          newState: JSON.stringify(updatedFlag),
        },
      });

      return jsonSuccess({ featureFlag: updatedFlag });
    }

    return jsonError('No recognized mutation payload provided.', 'INVALID_PAYLOAD', 400);
  } catch (err: any) {
    return jsonError(err.message, 'SETTINGS_MUTATION_ERROR', 500);
  }
}
