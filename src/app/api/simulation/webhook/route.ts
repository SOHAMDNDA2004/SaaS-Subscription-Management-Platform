import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhookEvent } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, userId, planSlug } = body;

    const targetUserId = userId || db.getActiveUserId();
    const user = (await db.getUserById(targetUserId)) || db.getActiveUser();
    const currentSub = await db.getSubscriptionByUserId(targetUserId);

    let syntheticEvent: any;

    switch (eventType) {
      case 'checkout.session.completed': {
        const plan = planSlug ? await db.getPlanBySlug(planSlug) : await db.getPlanBySlug('pro');
        syntheticEvent = {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: `cs_sim_${Date.now()}`,
              customer_email: user.email,
              amount_total: plan ? plan.priceMonthly : 4900,
              currency: 'usd',
              subscription: `sub_sim_${Date.now()}`,
              metadata: {
                userId: user.id,
                planId: plan?.id || 'plan_pro',
                billingCycle: 'MONTHLY',
              },
            },
          },
        };
        break;
      }

      case 'customer.subscription.updated': {
        const plan = planSlug ? await db.getPlanBySlug(planSlug) : await db.getPlanBySlug('enterprise');
        syntheticEvent = {
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: currentSub?.stripeSubscriptionId || 'sub_1OqK2x8291KlMN',
              status: 'active',
              cancel_at_period_end: false,
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
              items: {
                data: [
                  {
                    price: {
                      id: plan?.stripePriceIdMonthly || 'price_enterprise_monthly_live_test',
                    },
                  },
                ],
              },
            },
          },
        };
        break;
      }

      case 'customer.subscription.deleted': {
        syntheticEvent = {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: currentSub?.stripeSubscriptionId || 'sub_1OqK2x8291KlMN',
              status: 'canceled',
            },
          },
        };
        break;
      }

      case 'invoice.payment_succeeded': {
        syntheticEvent = {
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: `in_sim_${Date.now()}`,
              subscription: currentSub?.stripeSubscriptionId || 'sub_1OqK2x8291KlMN',
              payment_intent: `pi_sim_${Date.now()}`,
              number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              amount_due: 4900,
              amount_paid: 4900,
              currency: 'usd',
              billing_reason: 'subscription_cycle',
              hosted_invoice_url: `https://pay.stripe.com/invoice/sim_${Date.now()}`,
            },
          },
        };
        break;
      }

      case 'invoice.payment_failed': {
        syntheticEvent = {
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: `in_sim_fail_${Date.now()}`,
              subscription: currentSub?.stripeSubscriptionId || 'sub_1OqK2x8291KlMN',
              number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              amount_due: 4900,
              billing_reason: 'subscription_cycle',
              hosted_invoice_url: `https://pay.stripe.com/invoice/sim_fail_${Date.now()}`,
            },
          },
        };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown eventType: ${eventType}` }, { status: 400 });
    }

    // Process event
    const result = await processStripeWebhookEvent(syntheticEvent);

    return NextResponse.json({
      success: true,
      message: `Simulated Stripe webhook "${eventType}" executed successfully!`,
      event: syntheticEvent,
      result,
    });
  } catch (error: any) {
    console.error('Webhook simulation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
