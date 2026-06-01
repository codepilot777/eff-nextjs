import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 可能是 "Trainee" 或 "Instructor"

    const dbPath = path.resolve(process.cwd(), 'eff_database.db');
    const db = new Database(dbPath, { readonly: true });
    
    const rows = db.prepare('SELECT flight_no, data FROM flights').all() as { flight_no: string, data: string }[];
    
    let flights = rows.map(r => {
      const parsed = JSON.parse(r.data);
      parsed._db_id = r.flight_no; 
      return parsed;
    });

    // 🌟 權限過濾：學員 (Trainee) 只能看到已發佈 (Published) 的航班
    if (role === 'Trainee') {
      flights = flights.filter(f => f.is_published === true);
    }

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Database fetch all error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}