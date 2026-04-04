import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createSubscriptionSession } from '@/lib/stripe/client';
import { PLANS } from '@/lib/stripe/plans';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout session for either:
 * - One-time consumer report purchase
 * - Pro monthly subscription
 *
 * Attaches userId to session metadata for webhook processing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, assessmentId } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get current user for metadata (optional — checkout works for anonymous too)
    let userId: string | undefined;
    let customerEmail: string | undefined;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            cookies: {
              getAll() { return request.cookies.getAll(); },
              setAll() { /* read-only in route handlers */ },
            },
          }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          customerEmail = user.email || undefined;
        }
      } catch {
        // Continue without auth
      }
    }

    if (plan === 'consumerReport') {
      const planConfig = PLANS.consumerReport;
      if (!planConfig.priceId) {
        return NextResponse.json(
          { error: 'Stripe consumer report price not configured' },
          { status: 500 }
        );
      }

      const url = await createCheckoutSession({
        priceId: planConfig.priceId,
        userId,
        customerEmail,
        successUrl: `${appUrl}/report/search?purchased=true&assessment=${assessmentId || ''}`,
        cancelUrl: `${appUrl}/report/search?cancelled=true`,
        metadata: { assessmentId: assessmentId || '', plan: 'consumer_report' },
      });

      if (!url) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
      }
      return NextResponse.json({ url });
    }

    if (plan === 'proMonthly') {
      const planConfig = PLANS.proMonthly;
      if (!planConfig.priceId) {
        return NextResponse.json(
          { error: 'Stripe pro price not configured' },
          { status: 500 }
        );
      }

      const url = await createSubscriptionSession({
        priceId: planConfig.priceId,
        userId,
        customerEmail,
        successUrl: `${appUrl}/pro?subscribed=true`,
        cancelUrl: `${appUrl}/pro?cancelled=true`,
      });

      if (!url) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
      }
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
