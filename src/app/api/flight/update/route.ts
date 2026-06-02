import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST(request: Request) {
  try {
    // 1. 從前端獲取傳遞過來的 JSON Payload
    const body = await request.json();
    const { id, data } = body;

    // 防呆檢查
    if (!id || !data) {
      return NextResponse.json({ error: 'Missing flight id or data payload' }, { status: 400 });
    }

    // 2. 連接 Turso 雲端資料庫
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // 3. 執行 SQL 更新 (非同步執行)
    // 我們將整包新的 JSON data 轉換為字串，並覆寫對應 flight_no 的記錄
    const info = await db.execute({
      sql: 'UPDATE flights SET data = ? WHERE flight_no = ?',
      args: [JSON.stringify(data), id]
    });

    // 判斷是否成功更新 (Turso 使用 rowsAffected)
    if (info.rowsAffected > 0) {
      return NextResponse.json({ success: true, message: 'Flight updated successfully' });
    } else {
      return NextResponse.json({ error: 'Flight not found in database' }, { status: 404 });
    }

  } catch (error) {
    console.error('Failed to update flight data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}