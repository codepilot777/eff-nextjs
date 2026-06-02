import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET(request: Request) {
  // 從 URL 獲取 flight id，例如 /api/flight?id=CPA%20564
  const { searchParams } = new URL(request.url);
  const flightKey = searchParams.get('id') || 'CPA 564';

  try {
    // 🌟 連接 Turso 雲端資料庫
    // (將連線寫入 API 內部，確保 Vercel Serverless Function 每次執行都有正確 Context)
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // 🌟 非同步執行 SQL 查詢
    const result = await db.execute({
      sql: 'SELECT data FROM flights WHERE flight_no = ?',
      args: [flightKey]
    });

    // Turso 的結果會放在 rows 陣列中，我們取第一筆
    const row = result.rows[0];

    if (row && row.data) {
      // 將字串解析回 JSON Object (加上 as string 確保 TypeScript 不會報錯)
      const flightData = JSON.parse(row.data as string);
      return NextResponse.json(flightData);
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}