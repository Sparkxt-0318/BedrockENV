import { describe, it, expect } from 'vitest';

describe('Payment Plans', () => {
  it('exports correct plan prices', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.consumerReport.price).toBe(29);
    expect(PLANS.consumerReport.type).toBe('one_time');
    expect(PLANS.proMonthly.price).toBe(99);
    expect(PLANS.proMonthly.type).toBe('recurring');
  });

  it('consumer plan has expected features', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.consumerReport.features.length).toBeGreaterThan(0);
    expect(PLANS.consumerReport.features.some(f => f.includes('narrative'))).toBe(true);
  });

  it('pro plan has expected features', async () => {
    const { PLANS } = await import('@/lib/stripe/plans');
    expect(PLANS.proMonthly.features.length).toBeGreaterThan(0);
    expect(PLANS.proMonthly.features.some(f => f.includes('Unlimited'))).toBe(true);
  });
});
