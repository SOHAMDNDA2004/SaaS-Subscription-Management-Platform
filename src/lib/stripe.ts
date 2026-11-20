import Stripe from 'stripe';
import { db } from './db';
import { BillingCycle, Plan } from './types';

// Detect whether valid live/test Stripe keys are configured
const isRealStripeConfigured =
  process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('mock_stripe_key_placeholder') &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_');

export const stripe = isRealStripeConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-09-30.acacia' as any,
      typescript: true,
    })
  : null;

export interface CreateCheckoutParams {
  plan: Plan;
  billingCycle: BillingCycle;
  userId: string;
  userEmail: string;
  userName?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session or Sandbox Checkout Session
 */
export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { plan, billingCycle, userId, userEmail, successUrl, cancelUrl } = params;

  // 1. If real Stripe client is configured, interact with Stripe API
  if (stripe) {
    try {
      const priceId =
        billingCycle === 'MONTHLY' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userEmail,
        line_items: [
          {
            price: priceId || undefined,
            quantity: 1,
            // Fallback price data if priceId not registered on Stripe dashboard
            ...(!priceId && {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${plan.name} Plan`,
                  description: plan.description,
                },
                unit_amount:
                  billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly,
                recurring: {
                  interval: billingCycle === 'MONTHLY' ? 'month' : 'year',
                },
              },
            }),
          },
        ],
        metadata: {
          userId,
          planId: plan.id,
          planSlug: plan.slug,
          billingCycle,
        },
        subscription_data: {
          metadata: {
            userId,
            planId: plan.id,
          },
        },
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      return {
        url: session.url,
        sessionId: session.id,
        mode: 'live',
      };
    } catch (err: any) {
      console.warn('Stripe checkout error, falling back to sandbox mode:', err.message);
    }
  }

  // 2. Sandbox/Demo Checkout Engine
  // Generates a simulated checkout session for instant testing
  const sessionId = `cs_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const redirectUrl = `/checkout/success?session_id=${sessionId}&plan_id=${plan.id}&cycle=${billingCycle}&user_id=${userId}`;

  return {
    url: redirectUrl,
    sessionId,
    mode: 'sandbox',
  };
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  if (stripe && customerId && !customerId.startsWith('cus_sandbox')) {
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { url: portalSession.url };
    } catch (err: any) {
      console.warn('Customer portal error, using dashboard billing fallback:', err.message);
    }
  }

  return {
    url: '/dashboard?tab=billing_settings&message=portal_simulated',
  };
}

/**
 * Handle Stripe Webhook Events
 */
export async function processStripeWebhookEvent(event: {
  type: string;
  data: { object: any };
}) {
  const { type, data } = event;
  const object = data.object;

  await db.logAudit('STRIPE_WEBHOOK_RECEIVED', undefined, { type, id: object?.id });

  switch (type) {
    // 1. Checkout completed -> provision user subscription
    case 'checkout.session.completed': {
      const session = object;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const billingCycle = (session.metadata?.billingCycle || 'MONTHLY') as BillingCycle;

      if (userId && planId) {
        const plan = await db.getPlanById(planId);
        const now = new Date();
        const periodEnd = new Date(
          billingCycle === 'MONTHLY'
            ? now.getTime() + 30 * 24 * 60 * 60 * 1000
            : now.getTime() + 365 * 24 * 60 * 60 * 1000
        );

        const subscription = await db.createOrUpdateSubscription({
          userId,
          planId,
          stripeSubscriptionId: session.subscription || `sub_sim_${Date.now()}`,
          stripePriceId:
            billingCycle === 'MONTHLY'
              ? plan?.stripePriceIdMonthly
              : plan?.stripePriceIdYearly,
          status: 'ACTIVE',
          billingCycle,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
          cancelAtPeriodEnd: false,
        });

        // Generate paid invoice
        const amount =
          session.amount_total ||
          (plan
            ? billingCycle === 'MONTHLY'
              ? plan.priceMonthly
              : plan.priceYearly
            : 4900);

        await db.createInvoice({
          userId,
          subscriptionId: subscription.id,
          stripeInvoiceId: session.invoice || `in_sim_${Date.now()}`,
          number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amountDue: amount,
          amountPaid: amount,
          currency: session.currency || 'usd',
          status: 'PAID',
          billingReason: 'subscription_create',
          paidAt: now.toISOString(),
          invoicePdfUrl: `/api/invoices/inv_${Date.now()}/download`,
        });

        // Set or reset usage quotas based on plan limits
        if (plan) {
          await db.updateUsage(userId, 'api_calls', 0, plan.limits.apiCalls);
          await db.updateUsage(userId, 'team_seats', 1, plan.limits.teamSeats);
          await db.updateUsage(userId, 'storage_gb', 1, plan.limits.storageGb);
          await db.updateUsage(userId, 'projects', 1, plan.limits.projects);
        }

        await db.logAudit('SUBSCRIPTION_ACTIVATED', userId, {
          plan: plan?.name,
          billingCycle,
          subscriptionId: subscription.id,
        });
      }
      break;
    }

    // 2. Subscription updated -> upgraded, downgraded, or cancel_at_period_end toggled
    case 'customer.subscription.updated': {
      const stripeSub = object;
      const stripeSubscriptionId = stripeSub.id;
      const sub = await db.getSubscriptionByStripeId(stripeSubscriptionId);

      if (sub) {
        const stripePriceId = stripeSub.items?.data?.[0]?.price?.id;
        let planId = sub.planId;
        if (stripePriceId) {
          const matchingPlan = await db.getPlanByStripePrice(stripePriceId);
          if (matchingPlan) planId = matchingPlan.id;
        }

        const isCanceled = stripeSub.cancel_at_period_end;
        const status = stripeSub.status === 'active' ? 'ACTIVE' : (stripeSub.status?.toUpperCase() || sub.status);

        await db.createOrUpdateSubscription({
          id: sub.id,
          userId: sub.userId,
          planId,
          stripeSubscriptionId,
          stripePriceId,
          status,
          billingCycle: sub.billingCycle,
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000).toISOString()
            : sub.currentPeriodStart,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : sub.currentPeriodEnd,
          cancelAtPeriodEnd: isCanceled ?? sub.cancelAtPeriodEnd,
        });

        await db.logAudit('SUBSCRIPTION_UPDATED', sub.userId, {
          status,
          cancelAtPeriodEnd: isCanceled,
        });
      }
      break;
    }

    // 3. Subscription deleted / canceled
    case 'customer.subscription.deleted': {
      const stripeSub = object;
      const sub = await db.getSubscriptionByStripeId(stripeSub.id);
      if (sub) {
        await db.createOrUpdateSubscription({
          ...sub,
          status: 'CANCELED',
          canceledAt: new Date().toISOString(),
          cancelAtPeriodEnd: false,
        });
        await db.logAudit('SUBSCRIPTION_CANCELED', sub.userId, {
          stripeSubscriptionId: stripeSub.id,
        });
      }
      break;
    }

    // 4. Invoice payment succeeded
    case 'invoice.payment_succeeded': {
      const invoice = object;
      const stripeInvoiceId = invoice.id;
      const stripeSubscriptionId = invoice.subscription;
      const sub = stripeSubscriptionId
        ? await db.getSubscriptionByStripeId(stripeSubscriptionId)
        : null;

      if (sub) {
        await db.createInvoice({
          userId: sub.userId,
          subscriptionId: sub.id,
          stripeInvoiceId,
          stripePaymentIntentId: invoice.payment_intent,
          number: invoice.number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amountDue: invoice.amount_due || 4900,
          amountPaid: invoice.amount_paid || 4900,
          currency: invoice.currency || 'usd',
          status: 'PAID',
          billingReason: invoice.billing_reason || 'subscription_cycle',
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdfUrl: invoice.invoice_pdf || `/api/invoices/inv_${Date.now()}/download`,
          paidAt: new Date().toISOString(),
        });

        // Ensure subscription status is ACTIVE
        if (sub.status !== 'ACTIVE') {
          await db.createOrUpdateSubscription({
            ...sub,
            status: 'ACTIVE',
          });
        }

        await db.logAudit('INVOICE_PAID', sub.userId, {
          invoiceId: stripeInvoiceId,
          amount: invoice.amount_paid,
        });
      }
      break;
    }

    // 5. Invoice payment failed
    case 'invoice.payment_failed': {
      const invoice = object;
      const stripeSubscriptionId = invoice.subscription;
      const sub = stripeSubscriptionId
        ? await db.getSubscriptionByStripeId(stripeSubscriptionId)
        : null;

      if (sub) {
        await db.createOrUpdateSubscription({
          ...sub,
          status: 'PAST_DUE',
        });

        await db.createInvoice({
          userId: sub.userId,
          subscriptionId: sub.id,
          stripeInvoiceId: invoice.id,
          number: invoice.number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amountDue: invoice.amount_due || 4900,
          amountPaid: 0,
          currency: invoice.currency || 'usd',
          status: 'OPEN',
          billingReason: invoice.billing_reason || 'subscription_cycle',
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        });

        await db.logAudit('INVOICE_PAYMENT_FAILED', sub.userId, {
          invoiceId: invoice.id,
          amount: invoice.amount_due,
        });
      }
      break;
    }
  }

  return { success: true, handledType: type };
}
