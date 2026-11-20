import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCustomerPortalSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const user = db.getActiveUser();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/dashboard`;

    const customerId = user.stripeCustomerId || `cus_sandbox_${user.id}`;
    const portal = await createCustomerPortalSession(customerId, returnUrl);

    return NextResponse.json({
      success: true,
      url: portal.url,
    });
  } catch (error: any) {
    console.error('Customer portal session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
