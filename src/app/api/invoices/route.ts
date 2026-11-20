import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = db.getActiveUser();
    const invoices = await db.getInvoicesByUserId(user.id);
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
