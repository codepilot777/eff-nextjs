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
        ],
        history: [
  {
    "id": 3,
    "date": "13 JUN 2026",
    "action": "Normal Close",
    "flt": "CX501",
    "route": "NRT ➔ HKG",
    "blocksOff": "0110",
    "takeOff": "0125",
    "landing": "0530",
    "blocksOn": "0540",
    "def": [
      {
        "id": "A001",
        "status": "DEFERRED",
        "description": "LANDING GEAR GEAR-DOOR ACTUATOR ACCUMULATOR PRESSURE SLIGHTLY LOW."
      }
    ],
    "checks": ["EDTO Transit Check"],
    "serv": ["Nil Servicing Required"],
    "fuelUp": "28.5",
    "fuelArr": "10.5",
    "cmdr": "CHAN T M",
    "landingsCount": "1",
    "overshoots": "0",
    "touchGo": "0",
    "edto": "120 mins",
    "autoland": "Not Attempted"
  },
  {
    "id": 2,
    "date": "12 JUN 2026",
    "action": "Normal Close",
    "flt": "CX500",
    "route": "HKG ➔ NRT",
    "blocksOff": "0600",
    "takeOff": "0620",
    "landing": "0945",
    "blocksOn": "0955",
    "def": [
      {
        "id": "TL-8110",
        "status": "CLEARED",
        "description": "CAPTAIN SIDE WINDOW HEATER FAULT LIGHT ILLUMINATED."
      }
    ],
    "checks": ["Daily Check", "EDTO Transit Check"],
    "serv": ["Engine Oil: +1.5 Qts", "Hydraulic Fluid (Green): +0.5 Qts"],
    "fuelUp": "35.2",
    "fuelArr": "8.0",
    "cmdr": "WONG K K",
    "landingsCount": "1",
    "overshoots": "0",
    "touchGo": "0",
    "edto": "120 mins",
    "autoland": "Successful"
  },
  {
    "id": 1,
    "date": "11 JUN 2026",
    "action": "Air Return",
    "flt": "CX500",
    "route": "HKG ➔ HKG",
    "blocksOff": "0200",
    "takeOff": "0215",
    "landing": "0330",
    "blocksOn": "0345",
    "def": [
      {
        "id": "TL-8110",
        "status": "OPEN",
        "description": "CAPTAIN SIDE WINDOW HEATER FAULT LIGHT ILLUMINATED. RETURN TO BASE."
      }
    ],
    "checks": ["Pre-flight Check"],
    "serv": ["Potable Water: 100%"],
    "fuelUp": "40.0",
    "fuelArr": "25.5",
    "cmdr": "WONG K K",
    "landingsCount": "1",
    "overshoots": "0",
    "touchGo": "0",
    "edto": "No",
    "autoland": "Not Attempted"
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