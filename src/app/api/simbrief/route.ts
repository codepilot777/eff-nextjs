import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { simbriefBodySchema } from '@/lib/validation';
import { buildOfpSnapshot, type OfpSnapshot } from '@/lib/flight/ofpHistory';
import { generateRandomNotoc, type Notoc } from '@/lib/dg/dgRegistry';
import { generateCrewRoster, type CrewRoster } from '@/lib/crew/crewRoster';

export async function POST(request: Request) {
  try {
    if (!isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    const parsed = simbriefBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request body' }, { status: 400 });
    }
    const { username, flightNo, created_by, is_published, commander_override, crew_fd_override, crew_cc_override, include_notoc } = parsed.data;

    // 🌟 修正：舊版冇 encode username 就直接砌入 URL，
    // 如果 username 有特殊字符（例如 &）會篡改成個 query string
    const sbUrl = `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(username)}&json=1`;
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

      // 🌟 修復：以前教官可以喺建立表單填一個 zfw_override 直接覆寫呢個「OFP」欄位，
      // 令 PayloadTab.tsx 嘅 auto-fill（targetZFW = weight_zfw_ofp）同 Dashboard 顯示緊嘅
      // 「OFP ZFW」都唔再係真正 SimBrief flight plan 嘅數，變成教官自己作嘅數。
      // OFP 呢個欄位一定要係真正 dispatch 咗嘅 flight plan 數據，trainee 想改就用
      // Fuel & Weight 卡度嘅 Revised ZFW 輸入（trainee_input_zfw），唔應該喺建立航班
      // 嗰刻就已經俾教官竄改咗個基準
      weight_zfw_ofp: parseInt(weights.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(weights.est_tow || 0) / 1000.0,
      weight_lw_ofp: parseInt(weights.est_ldw || 0) / 1000.0,
      dow: parseInt(weights.oew || 161968),
      eet_seconds: parseInt(times.est_time_enroute || 0),
      ofp_version: 1,
      // 🌟 修復：以前一開機就自動 activate V1，令 flight plan activation status 恆定
      // 顯示「已 activate」，即使教官都未撳過個 activate 掣。而家跟返 ofpDeactivate
      // directive 已有嘅 0 = 未 activate 呢個慣例，預設要教官自己揀先 activate
      activated_version: 0,
      ofp_history: [] as { version: number; dispatched_at: string; snapshot: OfpSnapshot }[],

      captain: "INSTRUCTOR",
      // 🌟 教官喺建立表單度填嘅 Commander Name；呢個欄位喺 FmcCrewColumn.tsx/
      // ModalFMS.tsx 都有讀，以前一直冇寫入過
      commander_override: commander_override || "",
      // 🌟 邊個教官起呢班機，用嚟喺 instructor/page.tsx 嘅「Your Simulator Sessions」
      // 篩選返自己起嘅機；以前冇寫入，起機嗰個教官會即刻見唔返自己起嘅機
      created_by: created_by || "",
      // 🌟 以前呢個扁平欄位由始至終冇寫入過，PUBLISH 掣個成功彈窗淨係睇 client 端
      // 傳落嚟嘅值，唔理實際有冇寫入 DB，令「已 publish」變成假成功訊息
      is_published: is_published === true,
      dispatcher: "SYSTEM AUTO",
      // 🌟 教官喺建立表單度可以覆寫嘅機組人數，唔再永遠 hardcode 2/14
      crew_fd: crew_fd_override || 2,
      crew_cc: crew_cc_override || 14,
      water_fraction: 15,
      // 🌟 教官可以開關嘅 random NOTOC 危險品訓練演習——大部分航班都應該係
      // NIL（冇夾帶危險品），呢個先係現實入面最常見嘅結果
      notoc: null as Notoc | null,
      // 🌟 以前 Crew 卡淨係得機長用真數據，FO/cabin crew 係兩個永遠唔變嘅假名
      // （"MARTIN LEE"/"ALEX WONG"），而家跟返教官填嘅 crew_fd/crew_cc 人數
      // 生成一份真正嘅機組人員名單
      crew_roster: null as CrewRoster | null,

      pax_f: 0, pax_j: 0, pax_w: 0, pax_y: 0,
      cargo_bulk: 0, cargo_hold_1: 0, cargo_hold_2: 0, cargo_hold_3: 0, cargo_hold_4: 0,
      final_fuel_request: 0, actual_uplift: 0, estimated_uplift: 0, fuel_left_main: 0, fuel_center: 0, fuel_right_main: 0,
      fuel_on_board: 0,

      navlog: parsedNavlog,
      alternates: parsedAlternates,
      raw_simbrief: sbData,

      ezfw_sent: false,
      azf_sent: false,
      prelim_ls_sent: false,
      final_ls_sent: false,
      
      fuel_receipt_sent: false,
      final_fuel_accepted: false,
      // 🌟 ModalAcceptFuel.tsx 新增嘅 tank distribution / 通知第三方欄位，
      // 預設標準分配 + 兩邊都通知
      final_fuel_tanks_standard: true,
      final_fuel_notify_load_control: true,
      final_fuel_notify_fuel_company: true,

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

    flightData.ofp_history = [
      { version: 1, dispatched_at: new Date().toISOString(), snapshot: buildOfpSnapshot(flightData) },
    ];

    if (include_notoc) {
      flightData.notoc = generateRandomNotoc(flightData);
    }

    flightData.crew_roster = generateCrewRoster(flightData);

    await ensureSchema();

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