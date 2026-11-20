import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const users = await db.getUsers();
  const current = db.getActiveUser();
  return NextResponse.json({
    currentUser: current,
    availableUsers: users,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const user = db.setActiveUserId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
