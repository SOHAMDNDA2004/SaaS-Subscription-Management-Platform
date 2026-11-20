import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const users = await db.getUsers();
    // Attach current subscription to each user
    const usersWithSubs = await Promise.all(
      users.map(async (u) => {
        const sub = await db.getSubscriptionByUserId(u.id);
        const invoices = await db.getInvoicesByUserId(u.id);
        return {
          ...u,
          subscription: sub,
          invoicesCount: invoices.length,
          totalSpent: invoices
            .filter((i) => i.status === 'PAID')
            .reduce((sum, i) => sum + i.amountPaid, 0),
        };
      })
    );

    return NextResponse.json({ users: usersWithSubs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, targetPlanId, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Manually Override User Plan Tier
    if (action === 'override_plan') {
      const plan = await db.getPlanById(targetPlanId);
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      const currentSub = await db.getSubscriptionByUserId(userId);
      const updatedSub = await db.createOrUpdateSubscription({
        id: currentSub?.id,
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle: currentSub?.billingCycle || 'MONTHLY',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      });

      // Update limits
      await db.updateUsage(userId, 'api_calls', 0, plan.limits.apiCalls);
      await db.updateUsage(userId, 'team_seats', 1, plan.limits.teamSeats);
      await db.updateUsage(userId, 'storage_gb', 1, plan.limits.storageGb);
      await db.updateUsage(userId, 'projects', 1, plan.limits.projects);

      await db.logAudit('ADMIN_OVERRIDE_PLAN', userId, {
        plan: plan.name,
        targetPlanId,
      });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    // 2. Cancel or Modify Subscription Status
    if (action === 'set_subscription_status') {
      const currentSub = await db.getSubscriptionByUserId(userId);
      if (!currentSub) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      const updatedSub = await db.createOrUpdateSubscription({
        ...currentSub,
        status: status || 'CANCELED',
        canceledAt: status === 'CANCELED' ? new Date().toISOString() : undefined,
      });

      await db.logAudit('ADMIN_SET_SUBSCRIPTION_STATUS', userId, { status });

      return NextResponse.json({ success: true, subscription: updatedSub });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
