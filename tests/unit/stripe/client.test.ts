import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lib/stripe/client', () => {
  const originalEnv = process.env;
  const mockCreateSession = vi.fn();
  const mockStripeInstance = {
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  };

  beforeEach(() => {
    vi.resetModules();
    // doMock is not hoisted — runs after resetModules so the fresh module picks it up.
    // Must use a regular function (not arrow) so `new Stripe(...)` works.
    vi.doMock('stripe', () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: function MockStripe(_key: string, _opts: any) {
        return mockStripeInstance;
      },
    }));
    process.env = { ...originalEnv };
    mockCreateSession.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.doUnmock('stripe');
  });

  describe('getStripe', () => {
    it('returns null when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { getStripe } = await import('@/lib/stripe/client');
      expect(getStripe()).toBeNull();
    });

    it('returns a Stripe instance when STRIPE_SECRET_KEY is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      const { getStripe } = await import('@/lib/stripe/client');
      expect(getStripe()).not.toBeNull();
    });

    it('returns the same instance on repeated calls (singleton)', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      const { getStripe } = await import('@/lib/stripe/client');
      const a = getStripe();
      const b = getStripe();
      expect(a).toBe(b);
    });
  });

  describe('createCheckoutSession', () => {
    it('returns null when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { createCheckoutSession } = await import('@/lib/stripe/client');
      const result = await createCheckoutSession({
        priceId: 'price_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
      expect(result).toBeNull();
    });

    it('returns session URL on success', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/abc123' });

      const { createCheckoutSession } = await import('@/lib/stripe/client');
      const url = await createCheckoutSession({
        priceId: 'price_123',
        userId: 'user_abc',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { reportId: 'rpt_001' },
      });
      expect(url).toBe('https://checkout.stripe.com/pay/abc123');
    });

    it('creates a one-time payment session', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/xyz' });

      const { createCheckoutSession } = await import('@/lib/stripe/client');
      await createCheckoutSession({
        priceId: 'price_consumer_report',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'payment' })
      );
    });

    it('passes metadata to the Stripe session', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/meta' });

      const { createCheckoutSession } = await import('@/lib/stripe/client');
      await createCheckoutSession({
        priceId: 'price_123',
        userId: 'user_99',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { assessmentId: 'asmt_42' },
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: 'user_99', assessmentId: 'asmt_42' }),
        })
      );
    });
  });

  describe('createSubscriptionSession', () => {
    it('returns null when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { createSubscriptionSession } = await import('@/lib/stripe/client');
      const result = await createSubscriptionSession({
        priceId: 'price_pro_monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
      expect(result).toBeNull();
    });

    it('returns session URL on success', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/sub123' });

      const { createSubscriptionSession } = await import('@/lib/stripe/client');
      const url = await createSubscriptionSession({
        priceId: 'price_pro_monthly',
        userId: 'user_abc',
        customerEmail: 'pro@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
      expect(url).toBe('https://checkout.stripe.com/pay/sub123');
    });

    it('creates a subscription session', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/sub456' });

      const { createSubscriptionSession } = await import('@/lib/stripe/client');
      await createSubscriptionSession({
        priceId: 'price_pro_monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'subscription' })
      );
    });
  });
});
