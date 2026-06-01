import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { username, flightNo } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'SimBrief Username is required' }, { status: 400 });
    }

    const sbUrl = `https://www.simbrief.com/api/xml.fetcher.php?username=${username}&json=1`;
    const sbRes = await fetch(sbUrl);
    const sbData = await sbRes.json();

    if (sbData.fetch?.status !== 'Success') {
      return NextResponse.json({ error: 'SimBrief Fetch Failed: ' + sbData.fetch?.status }, { status: 400 });
    }

    const gen = sbData.general || {};
    const orig = sbData.origin || {};
    const dest = sbData.destination || {};
    const fuel = sbData.fuel || {};
    const weights = sbData.weights || {};
    const times = sbData.times || {};

    const targetPayload = parseInt(weights.est_zfw || 0) - parseInt(weights.oew || 161968);
    let paxTotal = Math.floor(targetPayload / 104);
    if (paxTotal > 438) paxTotal = 438;
    const paxJ = Math.min(42, Math.floor(paxTotal * 0.1));
    const paxY = paxTotal - paxJ;

    let remCargo = targetPayload - (paxTotal * 84);
    if (remCargo < 0) remCargo = 0;
    const h1 = Math.floor(remCargo * 0.3);
    const h2 = Math.floor(remCargo * 0.3);
    const h3 = Math.floor(remCargo * 0.2);
    const h4 = Math.floor(remCargo * 0.1);
    const blk = Math.floor(remCargo - h1 - h2 - h3 - h4);

    const stdUnix = parseInt(times.est_out || 0);
    const staUnix = parseInt(times.est_in || 0);
    const formatTime = (unix: number) => {
        if (!unix) return "0000Z";
        const d = new Date(unix * 1000);
        return d.toISOString().substring(11, 16).replace(":", "") + "Z";
    };

    // 🌟 新增：解析 Navlog 航點陣列
    const rawNavlog = sbData.navlog?.fix || [];
    const fixArray = Array.isArray(rawNavlog) ? rawNavlog : [rawNavlog];
    const parsedNavlog = fixArray.map((fix: any) => ({
      ident: fix.ident || "UKN",
      time_accum: Math.floor(parseInt(fix.time_total || 0) / 60), // 秒轉分鐘
      efob: parseInt(fix.fuel_plan_onboard || 0) / 1000.0 // 轉噸
    }));

    // 🌟 新增：解析 Alternates 備降場陣列
    const rawAltn = sbData.alternate;
    const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : []);
    const parsedAlternates = altnArray.map((a: any) => ({
      icao: a.icao_code || "N/A",
      burn: parseInt(a.burn || 0) / 1000.0,
      time: Math.floor(parseInt(a.time || 0) / 60),
      notam: "NIL"
    }));

    const finalFlightNo = flightNo || `${gen.icao_airline} ${gen.flight_number}`;
    
    const flightData = {
      flight_no: finalFlightNo,
      aircraft_reg: gen.aircraft_reg || "B-HNQ",
      aircraft_type: gen.icao_aircraft || "B773",
      route_id: gen.route || "DCT",
      dep_icao: orig.icao_code || "VHHH",
      arr_icao: dest.icao_code || "RJBB",
      altn_icao: parsedAlternates.length > 0 ? parsedAlternates[0].icao : "N/A",
      std_z: formatTime(stdUnix),
      sta_z: formatTime(staUnix),
      std_unix: stdUnix,
      sta_unix: staUnix,
      cruise_alt: gen.initial_altitude || "35000",
      avg_wind: gen.avg_wind_comp || "N/A",
      fuel_taxi_ofp: parseInt(fuel.taxi || 0) / 1000.0,
      fuel_trip_ofp: parseInt(fuel.enroute_burn || 0) / 1000.0,
      fuel_cont_ofp: parseInt(fuel.contingency || 0) / 1000.0,
      fuel_altn_ofp: parseInt(fuel.alternate_burn || 0) / 1000.0,
      fuel_reserve_ofp: parseInt(fuel.reserve || 0) / 1000.0,
      weight_zfw_ofp: parseInt(weights.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(weights.est_tow || 0) / 1000.0,
      weight_lw_ofp: parseInt(weights.est_ldw || 0) / 1000.0,
      dow: parseInt(weights.oew || 161968),
      eet_seconds: parseInt(times.est_time_enroute || 0),
      ofp_version: 1,
      captain: "INSTRUCTOR",
      dispatcher: "SYSTEM AUTO",
      pax_y: paxY,
      pax_j: paxJ,
      pax_f: 0,
      pax_w: 0,
      cargo_bulk: blk,
      cargo_hold_1: h1,
      cargo_hold_2: h2,
      cargo_hold_3: h3,
      cargo_hold_4: h4,
      
      navlog: parsedNavlog, // 寫入資料庫
      alternates: parsedAlternates, // 寫入資料庫

      ezfw_sent: true,
      azf_sent: false,
      prelim_ls_sent: false,
      final_ls_sent: false,
      fuel_receipt_sent: false,
      final_fuel_accepted: false,
      pilots_signed_prelim: false,
      pilots_signed_final: false,
      pilots_signed_fuel: false
    };

    const dbPath = path.resolve(process.cwd(), 'eff_database.db');
    const db = new Database(dbPath);
    
    db.prepare(`
      CREATE TABLE IF NOT EXISTS flights (
        flight_no TEXT PRIMARY KEY,
        data JSON
      )
    `).run();

    const stmt = db.prepare('REPLACE INTO flights (flight_no, data) VALUES (?, ?)');
    stmt.run(finalFlightNo, JSON.stringify(flightData));

    return NextResponse.json({ success: true, flight_no: finalFlightNo });

  } catch (error) {
    console.error("SimBrief Integration Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}