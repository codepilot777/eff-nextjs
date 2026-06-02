import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// 建立獨立的 Turso 雲端連線
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 1. 獲取獨立的 TechLog 數據
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const flightNo = searchParams.get('flight_no');

    if (!flightNo) {
      return NextResponse.json({ error: 'Missing flight_no parameter' }, { status: 400 });
    }

    // 初始化自動建立獨立的 techlogs 資料表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS techlogs (
        flight_no TEXT PRIMARY KEY,
        data JSON
      )
    `);

    const result = await db.execute({
      sql: 'SELECT data FROM techlogs WHERE flight_no = ?',
      args: [flightNo]
    });

    const row = result.rows[0];
    if (row && row.data) {
      return NextResponse.json(JSON.parse(row.data as string));
    } else {
      // 若資料表內未有該航段的 TechLog 紀錄，回傳預設結構
      const defaultTl = {
        tl_prepared: false,
        tl_fuel_record_completed: false,
        tl_accept: false,
        tl_flight_started: false,
        tl_flight_status: "SCHEDULED", // SCHEDULED, IN_FLIGHT, ARRIVED, DIVERTED, RETURNED
        tl_fluids: false,
        tl_checks: false,
        tl_defects: false,
        tl_release: false,
        tl_total_departure_fuel: "0.0",
        tl_actual_uplift: "0.0",
        defects: [
          { id: "TL-8421", ata: "32", description: "[ATA 32] LANDING GEAR GEAR-DOOR ACTUATOR ACCUMULATOR PRESSURE SLIGHTLY LOW.", status: "OPEN", time: "0412Z", reported_by: "ENGINEER" }
        ]
      };
      return NextResponse.json(defaultTl);
    }
  } catch (error) {
    console.error('Techlog GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 2. 更新獨立的 TechLog 數據
export async function POST(request: Request) {
  try {
    const { flight_no, data } = await request.json();

    if (!flight_no || !data) {
      return NextResponse.json({ error: 'Missing flight_no or data payload' }, { status: 400 });
    }

    await db.execute({
      sql: 'REPLACE INTO techlogs (flight_no, data) VALUES (?, ?)',
      args: [flight_no, JSON.stringify(data)]
    });

    return NextResponse.json({ success: true, message: 'TechLog data synchronized' });
  } catch (error) {
    console.error('Techlog POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}