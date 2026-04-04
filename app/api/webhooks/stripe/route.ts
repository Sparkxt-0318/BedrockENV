import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client using the service role key.
 * This bypasses RLS for webhook-initiated database operations.
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events:
 * - checkout.session.completed: Mark report as purchased or activate subscription
 * - customer.subscription.deleted: Downgrade user to free tier
 * - customer.subscription.updated: Update subscription status
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const assessmentId = session.metadata?.assessmentId;
      const plan = session.metadata?.plan;

      if (session.mode === 'payment' && supabase && userId) {
        // One-time report purchase — increment reports_purchased & create report record
        console.log(`Report purchased by user ${userId}, session ${session.id}`);

        // Increment reports_purchased on profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('reports_purchased')
          .eq('id', userId)
          .single();

        await supabase
          .from('profiles')
          .update({
            reports_purchased: (profile?.reports_purchased || 0) + 1,
            stripe_customer_id: session.customer as string || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // Create a report record to mark it as purchased
        if (assessmentId) {
          await supabase.from('reports').insert({
            user_id: userId,
            assessment_id: assessmentId,
            report_type: plan === 'consumer_report' ? 'consumer' : 'pro',
            layers_included: ['water', 'soil'],
            disclaimers: [
              'This report aggregates publicly available federal data and is not a substitute for professional environmental testing.',
            ],
          });
        }
      } else if (session.mode === 'subscription' && supabase && userId) {
        // Pro subscription activated
        console.log(`Pro subscription activated for user ${userId}, session ${session.id}`);

        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'pro',
            stripe_customer_id: session.customer as string || undefined,
            stripe_subscription_id: session.subscription as string || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription cancelled: ${subscription.id}`);

      if (supabase) {
        // Downgrade user to free tier
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

      if (supabase && subscription.status === 'past_due') {
        // Mark as past due but don't downgrade yet (Stripe may recover payment)
        console.warn(`Subscription ${subscription.id} is past due`);
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
