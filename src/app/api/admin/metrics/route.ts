import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const analytics = await db.getAnalytics();
    const auditLogs = await db.getAuditLogs(15);
    const users = await db.getUsers();

    return NextResponse.json({
      analytics,
      auditLogs,
      totalUsers: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
