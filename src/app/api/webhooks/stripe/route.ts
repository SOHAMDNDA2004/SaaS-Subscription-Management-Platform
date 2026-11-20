import { NextRequest, NextResponse } from 'next/server';
import { stripe, processStripeWebhookEvent } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  // 1. Signature Verification if live Stripe client and secret exist
  if (stripe && webhookSecret && signature && !webhookSecret.includes('placeholder')) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Stripe Webhook Signature Verification Failed: ${err.message}`);
      await db.logAudit('WEBHOOK_SIGNATURE_FAILED', undefined, { error: err.message });
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // 2. Parse JSON body for local sandbox/test runner
    try {
      event = JSON.parse(body);
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  // 3. Process the event idempotently
  try {
    const result = await processStripeWebhookEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (err: any) {
    console.error('Error handling webhook event:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
