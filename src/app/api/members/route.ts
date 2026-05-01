// API route for fetching Group 3 members from Neon DB
// GET /api/members

import { NextResponse } from 'next/server';
import { initDb, getMembers } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const members = await getMembers();
    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
