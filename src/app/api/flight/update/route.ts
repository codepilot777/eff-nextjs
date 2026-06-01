import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: Request) {
  try {
    // 1. 從前端獲取傳遞過來的 JSON Payload
    const body = await request.json();
    const { id, data } = body;

    // 防呆檢查
    if (!id || !data) {
      return NextResponse.json({ error: 'Missing flight id or data payload' }, { status: 400 });
    }

    // 2. 連接 SQLite 資料庫
    const dbPath = path.resolve(process.cwd(), 'eff_database.db');
    const db = new Database(dbPath);

    // 3. 執行 SQL 更新
    // 我們將整包新的 JSON data 轉換為字串，並覆寫對應 flight_no 的記錄
    const stmt = db.prepare('UPDATE flights SET data = ? WHERE flight_no = ?');
    const info = stmt.run(JSON.stringify(data), id);

    if (info.changes > 0) {
      return NextResponse.json({ success: true, message: 'Flight updated successfully' });
    } else {
      return NextResponse.json({ error: 'Flight not found in database' }, { status: 404 });
    }

  } catch (error) {
    console.error('Failed to update flight data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}