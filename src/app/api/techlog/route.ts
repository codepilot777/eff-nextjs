import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reg = searchParams.get('reg');

    if (!reg) {
      return NextResponse.json({ error: 'Missing reg parameter' }, { status: 400 });
    }

    await ensureSchema();

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
  tl_fluids: true,
  tl_checks: true,
  tl_defects: true,
  tl_release: true,
  tl_accept: false,
  tl_flight_started: false,
  tl_flight_status: "SCHEDULED",
  tl_prep_flt: "CX500",
  tl_prep_dep: "HKG",
  tl_prep_arr: "NRT",
  tl_cmdr: "CHAN T M",
  tl_galaxy_id: "123456",
  tl_prev_flt: "CX691",
  tl_prev_dep: "SIN",
  tl_prev_arr: "HKG",
  tl_prev_fob: "10.5",

  // 🌟 全新加入：Maintenance Release (CRS) 簽發編號
  crs_id: "CRS-9412-X",

  // 🌟 全新加入：當前航班嘅 Pre-flight Engineering Action Log
  tl_entries: [
    {
      id: "ENT-6102",
      time: "0830Z",
      action: "DEFECT RECTIFIED",
      ref: "A4821",
      desc: "Replaced Captain side window heater sensor. System tested IAW AMM 30-11-00. Ops normal.",
      sign: "ENG WONG K K (#8821)"
    },
    {
      id: "SRV-8834",
      time: "0845Z",
      action: "SERVICING UPLIFT",
      ref: "N/A",
      desc: "Engine Oil: +1.5 Qts (Eng 1), +0.5 Qts (Eng 2). Hyd Fluid: +1.0 Qts.",
      sign: "ENG WONG K K (#8821)"
    },
    {
      id: "ENT-6103",
      time: "0900Z",
      action: "MAINTENANCE CHECK",
      ref: "N/A",
      desc: "Daily Check & EDTO Transit Check completed. CRS Signed.",
      sign: "ENG WONG K K (#8821)"
    }
  ],

  // 當前活躍嘅 Defects (模擬有一條 PADD 留低)
  defects: [
    {
      id: "P7319",
      ata: "21",
      description: "[ATA 21 - Air Conditioning] Pack 1 flow control valve intermittent fault. Deferred IAW MEL 21-51-01.",
      status: "DEFERRED",
      time: "14:30Z",
      reported_by: "ENGINEER"
    }
  ],

  // 🌟 10 程亞洲 Regional 歷史航班 (包含一次 Air Return)
  flights: [
    {
      id: "SEC-1010", date: "13 JUN 2026", action: "Normal Close", flt: "CX691", route: "SIN ➔ HKG",
      blocksOff: "0600", takeOff: "0615", landing: "0945", blocksOn: "0950",
      def: [], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "22.5", fuelArr: "10.5", cmdr: "LEE M H", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "120 mins", autoland: "Not Attempted"
    },
    {
      id: "SEC-1009", date: "12 JUN 2026", action: "Normal Close", flt: "CX690", route: "HKG ➔ SIN",
      blocksOff: "0015", takeOff: "0030", landing: "0410", blocksOn: "0415",
      def: [{ id: "S1204", status: "CLEARED", description: "Seat 12A recline function inop." }], checks: ["Daily Check"], serv: ["Potable Water: 100%"],
      fuelUp: "28.0", fuelArr: "8.2", cmdr: "LEE M H", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "120 mins", autoland: "Not Attempted"
    },
    {
      id: "SEC-1008", date: "11 JUN 2026", action: "Normal Close", flt: "CX507", route: "KIX ➔ HKG",
      blocksOff: "0900", takeOff: "0915", landing: "1220", blocksOn: "1230",
      def: [], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "20.1", fuelArr: "7.5", cmdr: "CHEUNG W S", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1007", date: "11 JUN 2026", action: "Normal Close", flt: "CX506", route: "HKG ➔ KIX",
      blocksOff: "0230", takeOff: "0245", landing: "0650", blocksOn: "0700",
      def: [], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "24.5", fuelArr: "8.0", cmdr: "CHEUNG W S", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1006", date: "10 JUN 2026", action: "Normal Close", flt: "CX702", route: "BKK ➔ HKG",
      blocksOff: "1130", takeOff: "1145", landing: "1420", blocksOn: "1430",
      def: [{ id: "A4821", status: "OPEN", description: "Captain side window heater fault light illuminated." }], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "18.5", fuelArr: "6.5", cmdr: "WONG K K", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1005", date: "10 JUN 2026", action: "Air Return", flt: "CX701", route: "HKG ➔ HKG",
      blocksOff: "0600", takeOff: "0615", landing: "0730", blocksOn: "0745",
      def: [{ id: "P7319", status: "OPEN", description: "Pack 1 flow control valve fault. Return to base." }], checks: ["Pre-flight Check"], serv: ["Nil Servicing Required"],
      fuelUp: "22.0", fuelArr: "18.5", cmdr: "WONG K K", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1004", date: "09 JUN 2026", action: "Normal Close", flt: "CX701", route: "HKG ➔ BKK",
      blocksOff: "0100", takeOff: "0115", landing: "0345", blocksOn: "0355",
      def: [], checks: ["Daily Check"], serv: ["Engine Oil: +1.0 Qts"],
      fuelUp: "21.5", fuelArr: "7.2", cmdr: "HO Y T", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1003", date: "08 JUN 2026", action: "Normal Close", flt: "CX565", route: "TPE ➔ HKG",
      blocksOff: "1400", takeOff: "1415", landing: "1545", blocksOn: "1555",
      def: [], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "12.0", fuelArr: "6.8", cmdr: "CHAN T M", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Successful"
    },
    {
      id: "SEC-1002", date: "08 JUN 2026", action: "Normal Close", flt: "CX564", route: "HKG ➔ TPE",
      blocksOff: "1000", takeOff: "1015", landing: "1140", blocksOn: "1150",
      def: [], checks: ["Transit Check"], serv: ["Nil Servicing Required"],
      fuelUp: "13.5", fuelArr: "8.0", cmdr: "CHAN T M", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "No", autoland: "Not Attempted"
    },
    {
      id: "SEC-1001", date: "07 JUN 2026", action: "Normal Close", flt: "CX531", route: "NGO ➔ HKG",
      blocksOff: "0500", takeOff: "0515", landing: "0900", blocksOn: "0910",
      def: [{ id: "A2109", status: "CLEARED", description: "VHF 1 static noise." }], checks: ["Daily Check"], serv: ["APU Oil: +0.5 Qts"],
      fuelUp: "26.0", fuelArr: "9.5", cmdr: "LEE M H", landingsCount: "1", overshoots: "0", touchGo: "0", edto: "120 mins", autoland: "Not Attempted"
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
    // 🌟 `data` 而家係「部分更新」(patch)，喺 server 端同最新一份 row merge，
    // 避免教官/機師兩邊同時寫，一方用舊 snapshot 蓋走另一方啱啱寫低嘅欄位
    const { reg, data } = await request.json();

    if (!reg || !data) {
      return NextResponse.json({ error: 'Missing reg or data payload' }, { status: 400 });
    }

    await ensureSchema();

    const tx = await db.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data FROM techlogs WHERE reg = ?',
        args: [reg],
      });
      const row = result.rows[0];
      const current = row && row.data ? JSON.parse(row.data as string) : {};
      const merged = { ...current, ...data };

      await tx.execute({
        sql: 'REPLACE INTO techlogs (reg, data) VALUES (?, ?)',
        args: [reg, JSON.stringify(merged)],
      });

      await tx.commit();
      return NextResponse.json({ success: true, message: 'TechLog data synchronized', data: merged });
    } catch (err) {
      await tx.rollback();
      throw err;
    } finally {
      tx.close();
    }
  } catch (error) {
    console.error('Techlog POST DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
