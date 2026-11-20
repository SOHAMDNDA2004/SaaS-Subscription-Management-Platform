import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const invoice = await db.getInvoiceById(id);

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const user = (await db.getUserById(invoice.userId)) || db.getActiveUser();
    const subscription = invoice.subscriptionId
      ? await db.getSubscriptionByUserId(user.id)
      : null;
    const plan = subscription?.plan || (subscription ? await db.getPlanById(subscription.planId) : null);

    // Return a print-ready, professional HTML invoice that can be saved as PDF or viewed directly
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Invoice ${invoice.number} - SubSphere</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
        .invoice-box { max-width: 800px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 800; color: #4f46e5; display: flex; align-items: center; gap: 8px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-paid { background-color: #d1fae5; color: #065f46; }
        .badge-open { background-color: #fef3c7; color: #92400e; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; padding: 12px; background: #f8fafc; font-size: 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
        td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .totals { margin-left: auto; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .total-row.grand { font-size: 18px; font-weight: 800; border-top: 2px solid #e2e8f0; padding-top: 12px; color: #0f172a; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        @media print {
          body { margin: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">⚡ SubSphere Inc.</div>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              100 Innovation Way, Suite 400<br/>San Francisco, CA 94105<br/>billing@subsphere.dev
            </p>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0 0 6px 0; font-size: 22px; color: #0f172a;">INVOICE</h1>
            <div style="font-size: 14px; font-weight: 600; color: #475569;">${invoice.number}</div>
            <div style="margin-top: 8px;">
              <span class="badge ${invoice.status === 'PAID' ? 'badge-paid' : 'badge-open'}">
                ${invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <div class="section-title">Billed To</div>
            <div style="font-weight: 700; color: #0f172a;">${user.name || 'Valued Customer'}</div>
            <div style="font-size: 13px; color: #64748b;">${user.company || 'Enterprise Account'}</div>
            <div style="font-size: 13px; color: #64748b;">${user.email}</div>
          </div>
          <div style="text-align: right;">
            <div class="section-title">Invoice Details</div>
            <div style="font-size: 13px; color: #64748b;">Issue Date: <strong>${formatDate(invoice.createdAt)}</strong></div>
            <div style="font-size: 13px; color: #64748b;">Payment Date: <strong>${invoice.paidAt ? formatDate(invoice.paidAt) : 'Pending'}</strong></div>
            <div style="font-size: 13px; color: #64748b;">Payment Method: <strong>Card ending in 4242</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Period</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>SubSphere ${plan?.name || 'SaaS'} Subscription</strong><br/>
                <span style="font-size: 12px; color: #64748b;">${subscription?.billingCycle === 'YEARLY' ? 'Annual commitment' : 'Monthly recurring billing'}</span>
              </td>
              <td style="text-align: center; font-size: 13px; color: #64748b;">
                ${formatDate(subscription?.currentPeriodStart)} - ${formatDate(subscription?.currentPeriodEnd)}
              </td>
              <td style="text-align: right; font-weight: 600;">
                ${formatCurrency(invoice.amountDue, invoice.currency)}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span style="color: #64748b;">Subtotal</span>
            <span>${formatCurrency(invoice.amountDue, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span style="color: #64748b;">Tax (0%)</span>
            <span>$0.00</span>
          </div>
          <div class="total-row grand">
            <span>Total Paid</span>
            <span style="color: #4f46e5;">${formatCurrency(invoice.amountPaid, invoice.currency)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for partnering with SubSphere! Questions? Contact support@subsphere.dev</p>
          <p style="font-size: 11px; color: #cbd5e1;">Stripe Charge ID: ${invoice.stripePaymentIntentId || 'ch_simulated_mock'}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${invoice.number}.html"`,
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
