import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing flight id' }, { status: 400 });
    }

    // 🌟 連接 Turso 雲端資料庫 (Local 開發時如果冇填 ENV，會自動 fallback 用返 file)
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // 🌟 非同步執行 Delete (args 陣列用來防止 SQL Injection)
    const info = await db.execute({
      sql: 'DELETE FROM flights WHERE flight_no = ?',
      args: [id]
    });

    // 🌟 Turso 傳回的變更行數名稱叫 rowsAffected
    if (info.rowsAffected > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete flight:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}