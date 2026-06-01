import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const dbPath = path.resolve(process.cwd(), 'eff_database.db');
    const db = new Database(dbPath, { readonly: true });
    
    // 🌟 修正：從 SQLite 讀取所有航班，欄位名稱為 flight_no
    const rows = db.prepare('SELECT flight_no, data FROM flights').all() as { flight_no: string, data: string }[];
    
    // 將字串解析為 JSON，並注入資料庫的真實 id
    const flights = rows.map(r => {
      const parsed = JSON.parse(r.data);
      parsed._db_id = r.flight_no; // 🌟 修正：使用 flight_no 作為 Primary Key
      return parsed;
    });

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Database fetch all error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}