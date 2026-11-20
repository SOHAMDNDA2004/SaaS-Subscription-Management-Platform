import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const invoice = await db.getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Simulate successful payment retry
    const updatedInvoice = await db.updateInvoice(id, {
      status: 'PAID',
      amountPaid: invoice.amountDue,
      paidAt: new Date().toISOString(),
    });

    if (invoice.subscriptionId) {
      const sub = await db.getSubscriptionByUserId(invoice.userId);
      if (sub && sub.status === 'PAST_DUE') {
        await db.createOrUpdateSubscription({
          ...sub,
          status: 'ACTIVE',
        });
      }
    }

    await db.logAudit('INVOICE_PAYMENT_RETRIED', invoice.userId, {
      invoiceId: id,
      amount: invoice.amountDue,
      status: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
