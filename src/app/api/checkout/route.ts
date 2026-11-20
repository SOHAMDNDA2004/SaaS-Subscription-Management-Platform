import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { BillingCycle } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, billingCycle = 'MONTHLY', userId } = body;

    const activeUserId = userId || db.getActiveUserId();
    const user = await db.getUserById(activeUserId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = await db.getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/checkout/success`;
    const cancelUrl = `${appUrl}/dashboard/pricing?canceled=true`;

    const session = await createCheckoutSession({
      plan,
      billingCycle: billingCycle as BillingCycle,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
      mode: session.mode,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
