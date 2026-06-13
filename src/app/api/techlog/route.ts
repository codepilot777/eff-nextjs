import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 🌟 寫一個包底 Function：確保每次操作前 Table 一定存在
// 並且將 data 嘅 Type 轉做 SQLite 最穩陣嘅 TEXT
async function ensureTableExists() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS techlogs (
      reg TEXT PRIMARY KEY,
      data TEXT
    )
  `);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reg = searchParams.get('reg');

    if (!reg) {
      return NextResponse.json({ error: 'Missing reg parameter' }, { status: 400 });
    }

    // 🌟 每次 GET 前確保 Table 存在
    await ensureTableExists();

    const result = await db.execute({
      sql: 'SELECT data FROM techlogs WHERE reg = ?',
      args: [reg]
    });

    const row = result.rows[0];
    if (row && row.data) {
      return NextResponse.json(JSON.parse(row.data as string));
    } else {
      const defaultTl = {
        tl_prepared: false,
        tl_fuel_record_completed: false,
        tl_accept: false,
        tl_flight_started: false,
        tl_flight_status: "SCHEDULED", 
        tl_fluids: false,
        tl_checks: false,
        tl_defects: false,
        tl_release: false,
        tl_total_departure_fuel: "0.0",
        tl_actual_uplift: "0.0",
        defects: [
          { 
            id: "TL-8421", 
            ata: "32", 
            category: "ADD", 
            description: "[ATA 32] LANDING GEAR GEAR-DOOR ACTUATOR ACCUMULATOR PRESSURE SLIGHTLY LOW.", 
            status: "OPEN", 
            time: "0412Z", 
            reported_by: "ENGINEER" 
          }
        ]
      };
      return NextResponse.json(defaultTl);
    }
  } catch (error) {
    // 🌟 加強 Error Log，等你在 Terminal 睇得清清楚楚
    console.error('Techlog GET DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { reg, data } = await request.json();

    if (!reg || !data) {
      return NextResponse.json({ error: 'Missing reg or data payload' }, { status: 400 });
    }

    // 🌟 每次 POST (Save) 之前都確保 Table 存在，防止 Race Condition
    await ensureTableExists();

    await db.execute({
      sql: 'REPLACE INTO techlogs (reg, data) VALUES (?, ?)',
      args: [reg, JSON.stringify(data)]
    });

    return NextResponse.json({ success: true, message: 'TechLog data synchronized' });
  } catch (error) {
    console.error('Techlog POST DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}