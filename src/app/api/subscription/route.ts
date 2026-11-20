import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateProration } from '@/lib/utils';
import { BillingCycle } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = db.getActiveUser();
    const subscription = await db.getSubscriptionByUserId(user.id);
    const usage = await db.getUsageByUserId(user.id);
    const plans = await db.getPlans();

    return NextResponse.json({
      user,
      subscription,
      usage,
      plans,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = db.getActiveUser();
    const body = await req.json();
    const { action, planId, billingCycle } = body;

    const currentSub = await db.getSubscriptionByUserId(user.id);

    // 1. Cancel Subscription (at period end or immediately)
    if (action === 'cancel') {
      if (!currentSub) {
        return NextResponse.json({ error: 'No subscription found to cancel' }, { status: 400 });
      }
      const updated = await db.cancelSubscription(user.id, body.immediate || false);
      await db.logAudit('USER_CANCELED_SUBSCRIPTION', user.id, {
        planId: currentSub.planId,
        immediate: body.immediate,
      });
      return NextResponse.json({ success: true, subscription: updated });
    }

    // 2. Reactivate/Resume Subscription
    if (action === 'resume') {
      if (!currentSub) {
        return NextResponse.json({ error: 'No subscription found to resume' }, { status: 400 });
      }
      const updated = await db.createOrUpdateSubscription({
        ...currentSub,
        cancelAtPeriodEnd: false,
        canceledAt: undefined,
      });
      await db.logAudit('USER_RESUMED_SUBSCRIPTION', user.id, {
        planId: currentSub.planId,
      });
      return NextResponse.json({ success: true, subscription: updated });
    }

    // 3. Upgrade or Downgrade Plan
    if (action === 'switch_plan') {
      if (!planId) {
        return NextResponse.json({ error: 'Target planId required' }, { status: 400 });
      }
      const newPlan = await db.getPlanById(planId);
      if (!newPlan) {
        return NextResponse.json({ error: 'Target plan does not exist' }, { status: 404 });
      }

      const cycle = (billingCycle || currentSub?.billingCycle || 'MONTHLY') as BillingCycle;

      // Calculate proration
      const currentPlan = currentSub?.plan || (currentSub ? await db.getPlanById(currentSub.planId) : null);
      const currentPrice = currentPlan
        ? currentSub?.billingCycle === 'MONTHLY'
          ? currentPlan.priceMonthly
          : currentPlan.priceYearly
        : 0;
      const newPrice = cycle === 'MONTHLY' ? newPlan.priceMonthly : newPlan.priceYearly;

      const proration = calculateProration({
        currentPriceCents: currentPrice,
        newPriceCents: newPrice,
        daysRemainingInPeriod: 18,
      });

      const now = new Date();
      const periodEnd = new Date(
        cycle === 'MONTHLY'
          ? now.getTime() + 30 * 24 * 60 * 60 * 1000
          : now.getTime() + 365 * 24 * 60 * 60 * 1000
      );

      const updatedSub = await db.createOrUpdateSubscription({
        id: currentSub?.id,
        userId: user.id,
        planId: newPlan.id,
        stripeSubscriptionId: currentSub?.stripeSubscriptionId || `sub_${Date.now()}`,
        stripePriceId:
          cycle === 'MONTHLY'
            ? newPlan.stripePriceIdMonthly
            : newPlan.stripePriceIdYearly,
        status: 'ACTIVE',
        billingCycle: cycle,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
      });

      // Issue invoice for prorated charge or difference
      if (proration.netDueNow > 0) {
        await db.createInvoice({
          userId: user.id,
          subscriptionId: updatedSub.id,
          number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          amountDue: proration.netDueNow,
          amountPaid: proration.netDueNow,
          currency: 'usd',
          status: 'PAID',
          billingReason: 'subscription_update_proration',
          paidAt: now.toISOString(),
          invoicePdfUrl: `/api/invoices/inv_${Date.now()}/download`,
        });
      }

      // Update user limits according to new plan
      await db.updateUsage(user.id, 'api_calls', 0, newPlan.limits.apiCalls);
      await db.updateUsage(user.id, 'team_seats', 1, newPlan.limits.teamSeats);
      await db.updateUsage(user.id, 'storage_gb', 2, newPlan.limits.storageGb);
      await db.updateUsage(user.id, 'projects', 1, newPlan.limits.projects);

      await db.logAudit('PLAN_SWITCHED', user.id, {
        fromPlan: currentPlan?.name,
        toPlan: newPlan.name,
        billingCycle: cycle,
        prorationCharge: proration.netDueNow,
      });

      return NextResponse.json({
        success: true,
        subscription: updatedSub,
        proration,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
