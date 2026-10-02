import { CampaignEconomics, PricingRule } from '@nexeraquest/types';

/**
 * NexeraQuest Configurable Architecture
 * Handles open decisions from PRD cleanly with abstractions and defaults.
 */

export const DEFAULT_PRICING_RULE: PricingRule = {
  id: 'rule_default_standard',
  name: 'Standard Variable Tier (15%)',
  feePercentage: 15.0, // Configurable: 15% - 20%
  minimumFee: 25.0,    // Configurable flat floor
  flatFee: 0.0,
  currency: 'USDT',
  isActive: true,
};

export function calculateCampaignEconomics(
  rewardPerAction: number,
  targetParticipants: number,
  rule: Partial<PricingRule> = DEFAULT_PRICING_RULE
): CampaignEconomics {
  const safeReward = Math.max(0, Number(rewardPerAction) || 0);
  const safeTargets = Math.max(1, Math.floor(Number(targetParticipants) || 1));
  const rewardPool = Number((safeReward * safeTargets).toFixed(4));

  const pct = rule.feePercentage !== undefined ? rule.feePercentage : DEFAULT_PRICING_RULE.feePercentage;
  const minFee = rule.minimumFee !== undefined ? rule.minimumFee : DEFAULT_PRICING_RULE.minimumFee;
  const flat = rule.flatFee !== undefined ? rule.flatFee : DEFAULT_PRICING_RULE.flatFee;

  let feeAmount = (rewardPool * (pct / 100)) + flat;
  if (feeAmount < minFee && rewardPool > 0) {
    feeAmount = minFee;
  }
  feeAmount = Number(feeAmount.toFixed(4));
  const totalDeposit = Number((rewardPool + feeAmount).toFixed(4));

  return {
    rewardPerAction: safeReward,
    targetParticipants: safeTargets,
    rewardPool,
    feePercentage: pct,
    feeAmount,
    totalDeposit,
    currency: rule.currency || 'USDT',
  };
}

export const SUPPORTED_ASSETS = [
  { symbol: 'USDT', name: 'Tether USD', decimals: 6, isDefault: true },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, isDefault: false },
  { symbol: 'TON', name: 'Toncoin', decimals: 9, isDefault: false },
];

export const SUPPORTED_NETWORKS = [
  { id: 'ton', name: 'The Open Network (TON)', chainId: -239, asset: 'USDT / TON', explorerUrl: 'https://tonviewer.com/transaction/' },
  { id: 'arbitrum', name: 'Arbitrum One', chainId: 42161, asset: 'USDT / USDC', explorerUrl: 'https://arbiscan.io/tx/' },
  { id: 'polygon', name: 'Polygon PoS', chainId: 137, asset: 'USDT / USDC', explorerUrl: 'https://polygonscan.com/tx/' },
  { id: 'ethereum', name: 'Ethereum Mainnet', chainId: 1, asset: 'USDT / USDC', explorerUrl: 'https://etherscan.io/tx/' },
];

export const DEFAULT_TRUST_SCORE_CONFIG = {
  initialScore: 50,
  minScore: 0,
  maxScore: 100,
  rewards: {
    taskApproved: 2,
    streakBonus: 3,
    disputeWon: 5,
  },
  penalties: {
    taskRejected: -5,
    disputeLost: -10,
    fraudConfirmed: -35,
  },
  thresholds: {
    canWithdrawMinScore: 30,
    highReputationMinScore: 75,
    autoApproveTrustScore: 85,
  },
};

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  TELEGRAM_MEMBERSHIP_VERIFICATION: true,
  PROOF_SCREENSHOT_ANALYSIS: true,
  REFERRAL_SYSTEM: true,
  X_TWITTER_VERIFICATION: false, // Architectural plug ready
  DISCORD_VERIFICATION: false,    // Architectural plug ready
  ON_CHAIN_VERIFICATION: false,   // Architectural plug ready
  AUTO_PAYOUT_UNDER_LIMIT: true,  // Auto-authorizes sandbox/instant small payouts
};

export const WITHDRAWAL_LIMITS = {
  minimumAmount: 5.0, // Minimum USDT to request cashout
  maximumAmountPerDay: 1000.0,
  autoApprovalThreshold: 50.0, // Under 50 USDT processed instantly if risk is LOW
  feeRatePercentage: 1.0, // 1% network/handling fee
  minimumFee: 0.5,
};

export const APP_CONFIG = {
  name: 'NexeraQuest',
  tagline: 'QUEST. CONTRIBUTE. EARN.',
  botUsername: process.env.TELEGRAM_BOT_USERNAME || 'NexeraQuestBot',
  // Direct HTTPS URL of the Mini App (tunnel/hosting). Telegram web_app
  // buttons require this — t.me links alone don't open the WebView.
  miniAppUrl:
    process.env.NEXT_PUBLIC_MINI_APP_URL ||
    process.env.TELEGRAM_MINI_APP_URL ||
    'https://t.me/NexeraQuestBot/app',
  telegramMiniAppUrl:
    process.env.NEXT_PUBLIC_MINI_APP_URL ||
    process.env.TELEGRAM_MINI_APP_URL ||
    'https://t.me/NexeraQuestBot/app',
  defaultCurrency: 'USDT',
};
