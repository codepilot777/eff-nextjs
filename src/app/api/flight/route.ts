import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// 建立資料庫連線 (指向專案根目錄的 eff_database.db)
const dbPath = path.resolve(process.cwd(), 'eff_database.db');
const db = new Database(dbPath);

export async function GET(request: Request) {
  // 從 URL 獲取 flight id，例如 /api/flight?id=CPA%20564
  const { searchParams } = new URL(request.url);
  const flightKey = searchParams.get('id') || 'CPA 564';

  try {
    // 🌟 修正：執行 SQL 查詢時，欄位名稱改為 flight_no
    const stmt = db.prepare('SELECT data FROM flights WHERE flight_no = ?');
    const row = stmt.get(flightKey) as { data: string } | undefined;

    if (row) {
      // 將字串解析回 JSON Object
      const flightData = JSON.parse(row.data);
      return NextResponse.json(flightData);
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}