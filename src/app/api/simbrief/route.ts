import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

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
    const aircraft = sbData.aircraft || {};
    const orig = sbData.origin || {};
    const dest = sbData.destination || {};
    const fuel = sbData.fuel || {};
    const weights = sbData.weights || {};
    const times = sbData.times || {};

    const stdUnix = parseInt(times.est_out || 0);
    const staUnix = parseInt(times.est_in || 0);
    const formatTime = (unix: number) => {
        if (!unix) return "0000Z";
        const d = new Date(unix * 1000);
        return d.toISOString().substring(11, 16).replace(":", "") + "Z";
    };

    const rawNavlog = sbData.navlog?.fix || [];
    const fixArray = Array.isArray(rawNavlog) ? rawNavlog : [rawNavlog];
    const parsedNavlog = fixArray.map((fix: any) => ({
      ident: fix.ident || "UKN",
      time_accum: Math.floor(parseInt(fix.time_total || 0) / 60), 
      efob: parseInt(fix.fuel_plan_onboard || 0) / 1000.0 
    }));

    const rawAltn = sbData.alternate;
    const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : []);
    const parsedAlternates = altnArray.map((a: any) => ({
      icao: a.icao_code || "N/A",
      burn: parseInt(a.burn || 0) / 1000.0,
      time: Math.floor(parseInt(a.time || 0) / 60)
    }));

    const finalFlightNo = flightNo || `${gen.icao_airline} ${gen.flight_number}`;
    
    // 🌟 完美重構的 Flight Data Schema (支援 V1, V2, V3 歷史)
    const flightData = {
      flight_no: finalFlightNo,
      aircraft_reg: aircraft.reg || "B-HNQ",
      aircraft_type: aircraft.icao_code || "B773",
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
      plan_fuel_total: parseInt(fuel.plan_ramp || 0) / 1000.0,
      weight_fuel_reqd_ofp: parseInt(fuel.plan_takeoff || 0) / 1000.0, 

      weight_zfw_ofp: parseInt(weights.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(weights.est_tow || 0) / 1000.0,
      weight_lw_ofp: parseInt(weights.est_ldw || 0) / 1000.0,
      dow: parseInt(weights.oew || 161968),
      eet_seconds: parseInt(times.est_time_enroute || 0),
      ofp_version: 1,
      
      captain: "INSTRUCTOR",
      dispatcher: "SYSTEM AUTO",
      crew_fd: 2,
      crew_cc: 14,
      water_fraction: 15,

      pax_f: 0, pax_j: 0, pax_w: 0, pax_y: 0,
      cargo_bulk: 0, cargo_hold_1: 0, cargo_hold_2: 0, cargo_hold_3: 0, cargo_hold_4: 0,
      final_fuel_request: 0, actual_uplift: 0, fuel_left_main: 0, fuel_center: 0, fuel_right_main: 0,
      fuel_is_standard: false, fuel_on_board: 0,

      navlog: parsedNavlog,
      alternates: parsedAlternates,
      raw_simbrief: sbData,

      ezfw_sent: false,
      azf_sent: false,
      prelim_ls_sent: false,
      final_ls_sent: false,
      
      standby_fuel_sent: false,
      fuel_receipt_sent: false,
      final_fuel_accepted: false,
      
      pilots_signed_prelim: false,
      pilots_signed_final: false,
      pilots_signed_fuel: false,

      // 🌟 新增歷史數組
      prelim_history: [],
      final_history: [],
      prelim_ls_version: 1,
      final_ls_version: 1,

      prelim_ls_rejected: false,
      prelim_ls_reject_reason: "",
      final_ls_rejected: false,
      final_ls_reject_reason: ""
    };

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS flights (
        flight_no TEXT PRIMARY KEY,
        data JSON
      )
    `);

    await db.execute({
      sql: 'REPLACE INTO flights (flight_no, data) VALUES (?, ?)',
      args: [finalFlightNo, JSON.stringify(flightData)]
    });

    return NextResponse.json({ success: true, flight_no: finalFlightNo });

  } catch (error) {
    console.error("SimBrief Integration Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}