import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('stripe', () => ({
  default: function MockStripe() {
    return {
      checkout: { sessions: { create: mockCreate } },
      webhooks: { constructEvent: vi.fn() },
    };
  },
}));

import { getStripe, createCheckoutSession, createSubscriptionSession } from '@/lib/stripe/client';

describe('getStripe', () => {
  it('returns a Stripe instance when STRIPE_SECRET_KEY is set', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    const stripe = getStripe();
    expect(stripe).not.toBeNull();
  });

  it('returns the same singleton on repeated calls', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });
});

describe('createCheckoutSession', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
  });

  it('returns a checkout URL on success', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/abc' });

    const url = await createCheckoutSession({
      priceId: 'price_123',
      userId: 'user-1',
      customerEmail: 'test@example.com',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
    });

    expect(url).toBe('https://checkout.stripe.com/pay/abc');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: 'price_123', quantity: 1 }],
        success_url: 'https://app.com/success',
        cancel_url: 'https://app.com/cancel',
        customer_email: 'test@example.com',
        metadata: expect.objectContaining({ userId: 'user-1' }),
      })
    );
  });

  it('includes extra metadata when provided', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/xyz' });

    await createCheckoutSession({
      priceId: 'price_456',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
      metadata: { reportId: 'rpt-99' },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ userId: '', reportId: 'rpt-99' }),
      })
    );
  });

  it('passes empty string userId when userId is omitted', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/def' });

    await createCheckoutSession({
      priceId: 'price_789',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: '' },
      })
    );
  });
});

describe('createSubscriptionSession', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
  });

  it('returns a subscription checkout URL on success', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub/abc' });

    const url = await createSubscriptionSession({
      priceId: 'price_sub_123',
      userId: 'user-2',
      customerEmail: 'pro@example.com',
      successUrl: 'https://app.com/pro-success',
      cancelUrl: 'https://app.com/pro-cancel',
    });

    expect(url).toBe('https://checkout.stripe.com/sub/abc');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: 'price_sub_123', quantity: 1 }],
        success_url: 'https://app.com/pro-success',
        cancel_url: 'https://app.com/pro-cancel',
        customer_email: 'pro@example.com',
        metadata: { userId: 'user-2' },
      })
    );
  });

  it('passes empty string userId when userId is omitted', async () => {
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub/def' });

    await createSubscriptionSession({
      priceId: 'price_sub_456',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: '' },
      })
    );
  });
});
