import { describe, it, expect, vi, beforeEach } from 'vitest';

const constructEvent = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent },
  })),
}));

const mockFrom = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';

function makeRequest(body: string, signature = 'sig_test') {
  return new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
      'content-type': 'application/json',
    },
  });
}

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('rejects requests with missing signature', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing signature');
  });

  it('rejects requests with invalid signature', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = makeRequest('{}', 'invalid_sig');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed for one-time payment', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { reports_purchased: 2 } }),
      }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ data: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { select: mockSelect, update: mockUpdate };
      }
      if (table === 'reports') {
        return { insert: mockInsert };
      }
      return {};
    });

    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          mode: 'payment',
          customer: 'cus_test',
          metadata: {
            userId: 'user-uuid-123',
            assessmentId: 'assess-uuid-456',
            plan: 'consumer_report',
          },
        },
      },
    });

    const req = makeRequest('{"type":"checkout.session.completed"}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockFrom).toHaveBeenCalledWith('reports');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-uuid-123',
        assessment_id: 'assess-uuid-456',
        report_type: 'consumer',
      })
    );
  });

  it('handles checkout.session.completed for subscription', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null }),
    });

    mockFrom.mockImplementation(() => ({ update: mockUpdate }));

    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_sub',
          mode: 'subscription',
          customer: 'cus_test_pro',
          subscription: 'sub_test_123',
          metadata: { userId: 'user-uuid-pro' },
        },
      },
    });

    const req = makeRequest('{"type":"checkout.session.completed"}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_tier: 'pro',
        stripe_subscription_id: 'sub_test_123',
      })
    );
  });

  it('handles customer.subscription.deleted (downgrade)', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null }),
    });

    mockFrom.mockImplementation(() => ({ update: mockUpdate }));

    constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_cancelled_123' },
      },
    });

    const req = makeRequest('{"type":"customer.subscription.deleted"}');
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_tier: 'free',
        stripe_subscription_id: null,
      })
    );
  });

  it('returns 200 for unhandled event types (idempotent)', async () => {
    constructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    const req = makeRequest('{"type":"payment_intent.created"}');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });
});
