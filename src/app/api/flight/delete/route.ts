import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing flight id' }, { status: 400 });
    }

    const dbPath = path.resolve(process.cwd(), 'eff_database.db');
    const db = new Database(dbPath);

    const stmt = db.prepare('DELETE FROM flights WHERE flight_no = ?');
    const info = stmt.run(id);

    if (info.changes > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete flight:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}