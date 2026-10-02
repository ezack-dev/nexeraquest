import { describe, it, expect } from 'vitest';
import { calculateCampaignEconomics, DEFAULT_PRICING_RULE } from '@nexeraquest/config';

describe('Pricing & Fee Calculation Engine', () => {
  it('calculates standard 15% platform fee with minimum floor', () => {
    // 100 participants * 2.50 USDT = 250 USDT reward pool
    // 15% of 250 = 37.50 USDT (> 25 minimum floor)
    const eco = calculateCampaignEconomics(2.50, 100);
    expect(eco.rewardPool).toBe(250);
    expect(eco.feeAmount).toBe(37.5);
    expect(eco.totalDeposit).toBe(287.5);
    expect(eco.currency).toBe('USDT');
  });

  it('enforces the minimum platform fee floor for small reward pools', () => {
    // 10 participants * 1.00 USDT = 10 USDT reward pool
    // 15% of 10 = 1.50 USDT (< 25 minimum floor)
    // Fee must be floored at 25 USDT
    const eco = calculateCampaignEconomics(1.00, 10);
    expect(eco.rewardPool).toBe(10);
    expect(eco.feeAmount).toBe(25);
    expect(eco.totalDeposit).toBe(35);
  });

  it('supports custom dynamic pricing rule overrides', () => {
    const customRule = {
      feePercentage: 20.0,
      minimumFee: 50.0,
      flatFee: 10.0,
      currency: 'USDC',
    };
    // 500 reward pool
    // 20% of 500 = 100 + 10 flat = 110
    const eco = calculateCampaignEconomics(5.00, 100, customRule);
    expect(eco.rewardPool).toBe(500);
    expect(eco.feeAmount).toBe(110);
    expect(eco.totalDeposit).toBe(610);
    expect(eco.currency).toBe('USDC');
  });

  it('handles zero or negative inputs safely without NaN', () => {
    const eco = calculateCampaignEconomics(-5, 0);
    expect(eco.rewardPool).toBe(0);
    expect(eco.feeAmount).toBe(0);
    expect(eco.totalDeposit).toBe(0);
  });
});
