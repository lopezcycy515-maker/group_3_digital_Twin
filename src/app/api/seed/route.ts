// One-time seed route — creates all tables and inserts Group 3 members
// GET /api/seed

import { NextResponse } from 'next/server';
import { initDb, getMembers } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const members = await getMembers();
    return NextResponse.json(
      {
        message: 'Database initialized and members seeded successfully',
        membersInserted: members.length,
        members,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 },
    );
  }
}
