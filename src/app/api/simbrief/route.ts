import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { simbriefBodySchema } from '@/lib/validation';
import { buildOfpSnapshot, type OfpSnapshot } from '@/lib/flight/ofpHistory';
import { type Notoc } from '@/lib/dg/dgRegistry';
import { generateCrewRoster, type CrewRoster } from '@/lib/crew/crewRoster';
import { syncTechlogForNewFlight } from '@/lib/techlog/techlogContinuity';
import { getDynamicAhm } from '@/lib/loadsheet/loadsheetHelpers';
import { buildAutoEzfwSnapshot, computeEzfwTimeZ } from '@/lib/loadsheet/autoEzfw';
import { resolveBlockTimeSeconds, computeStaUnix } from '@/lib/flight/scheduleTimes';

export async function POST(request: Request) {
  try {
    if (!isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    const parsed = simbriefBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request body' }, { status: 400 });
    }
    const { username, flightNo, created_by, is_published, commander_override, crew_fd_override, crew_cc_override } = parsed.data;

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
    const formatTime = (unix: number) => {
        if (!unix) return "0000Z";
        const d = new Date(unix * 1000);
        return d.toISOString().substring(11, 16).replace(":", "") + "Z";
    };

    // 🌟 STA 一定要係 STD + Block Time，先可以保證 header 顯示嘅 BLOCK TIME 同
    // STA 減 STD 呢條數啱得返——以前 STA 直接用 SimBrief 自己嘅 times.est_in，
    // BLOCK TIME 就係 workspace/page.tsx 另一條完全獨立、粗略嘅估算公式計，
    // 兩個數冇保證一致。有 SimBrief 真正嘅 scheduled block time 就用嚟計 STA，
    // 冇（罕見）先 fallback 返 SimBrief 自己嘅 est_in
    const eetSeconds = parseInt(times.est_time_enroute || 0);
    const blockTimeSeconds = resolveBlockTimeSeconds(times, eetSeconds);
    const staUnix = computeStaUnix(stdUnix, blockTimeSeconds) || parseInt(times.est_in || 0);

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

    // 🌟 現實入面一定係先有 dispatch 派出嚟嘅第一個 EZFW，先至 based on 佢整出成份
    // OFP——唔會有「有 flight plan 但完全冇任何 EZFW」嘅狀態。SimBrief 淨係俾總
    // pax/cargo（唔分 class/hold），所以按呢架機 AHM 各 zone/hold 嘅載客量/載重量
    // 比例分攤，唔係亂噏數；ramp fuel 直接用 OFP 嘅 fuel.plan_ramp。
    const ezfwAhm = getDynamicAhm({ aircraft_reg: aircraft.reg || "B-HNQ" });
    const ezfwZoneKeys = Object.keys(ezfwAhm.stations.pax);
    const autoEzfwSnapshot = buildAutoEzfwSnapshot(
      ezfwAhm,
      parseInt(weights.pax_count_actual || weights.pax_count || 0),
      parseInt(weights.cargo || 0),
      parseInt(fuel.plan_ramp || 0)
    );

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
      // 🌟 workspace/page.tsx header 顯示嘅 BLOCK TIME 讀呢個欄位（唔再自己
      // 用「flight time + 40 分鐘」粗略估）——同上面 STA 用嘅係同一個數，
      // 兩者永遠一致
      block_time_seconds: blockTimeSeconds,
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
      eet_seconds: eetSeconds,
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

      // 🌟 呢四個扁平欄位（Dashboard/LoadsheetAirportColumn.tsx 讀緊嘅）跟返
      // PayloadTab.tsx 既有嘅「頭四個 zone key」慣例，用第一個 EZFW 分攤好嘅
      // pax 數填低，唔再一開機就係 0（0 要等教官手動入返先啱）
      pax_f: autoEzfwSnapshot.pax[ezfwZoneKeys[0]] || 0,
      pax_j: autoEzfwSnapshot.pax[ezfwZoneKeys[1]] || 0,
      pax_w: autoEzfwSnapshot.pax[ezfwZoneKeys[2]] || 0,
      pax_y: autoEzfwSnapshot.pax[ezfwZoneKeys[3]] || 0,
      cargo_bulk: autoEzfwSnapshot.cargo.bulk,
      cargo_hold_1: autoEzfwSnapshot.cargo.h1,
      cargo_hold_2: autoEzfwSnapshot.cargo.h2,
      cargo_hold_3: autoEzfwSnapshot.cargo.h3,
      cargo_hold_4: autoEzfwSnapshot.cargo.h4,
      final_fuel_request: 0, actual_uplift: 0, estimated_uplift: 0,
      fuel_left_main: autoEzfwSnapshot.fuel.left,
      fuel_center: autoEzfwSnapshot.fuel.center,
      fuel_right_main: autoEzfwSnapshot.fuel.right,
      fuel_on_board: 0,

      navlog: parsedNavlog,
      alternates: parsedAlternates,
      raw_simbrief: sbData,

      // 🌟 第一個 EZFW 一開機就已經係 dispatch 派出嚟嘅版本——ezfw_time 係
      // STD-120 分鐘（真實 EZFW 一定喺 STD 之前一段時間已經拍出嚟）
      ezfw_sent: true,
      ezfw_time: computeEzfwTimeZ(stdUnix),
      ezfw_snapshot: autoEzfwSnapshot,
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

    flightData.crew_roster = generateCrewRoster(flightData);

    await ensureSchema();

    // 🌟 修復：以前用 flight_no 做 PRIMARY KEY，REPLACE INTO 會令教官起第二個同
    // flight number 嘅 session 直接刪走第一個。而家用一個真正嘅 UUID 做 id，
    // flight_no 淨係普通欄位，容許重複，兩個 session 各自獨立存在
    const sessionId = randomUUID();
    // 🌟 raw_simbrief（完整 SimBrief 原始回應）而家搬咗做獨立欄（睇 db.ts 嘅
    // comment）——ofp_history[0].snapshot 仍然要完整一份（起機第一版 OFP 嘅
    // 歷史記錄），淨係 `data` 呢個 column 唔再帶埋頂層嗰份，等日常 read-modify-write
    // 唔使無辜搬呢 2MB
    const { raw_simbrief: rawSimbriefForColumn, ...flightDataForStorage } = flightData;
    await db.execute({
      sql: 'INSERT INTO flights (id, flight_no, data, raw_simbrief) VALUES (?, ?, ?, ?)',
      args: [sessionId, finalFlightNo, JSON.stringify(flightDataForStorage), JSON.stringify(rawSimbriefForColumn)]
    });

    // 🌟 起機嗰刻自動將呢架機嘅 techlog「Prepare Flight」同 continuity 同新 flight plan
    // 同步（唔一定由 HKG 出發，例如今次係外地飛返香港），唔使 trainee 手動入 e-techlog
    // 補一程先夾得返出發機場（睇 techlogContinuity.ts）
    // 🌟 修復：techlogs 而家 key by flight_id，唔再係 reg——揾返「呢個機牌最近一次」
    // 嘅 techlog 做 continuity 嘅種子（ORDER BY rowid DESC LIMIT 1），但用 INSERT
    // 幫呢個新 session 開一條佢自己獨立嘅 row，唔會再 REPLACE 咗仲用緊呢個機牌嘅
    // 另一個 session 嘅 techlog（defects/accept 狀態）
    const techlogRow = await db.execute({
      sql: 'SELECT data FROM techlogs WHERE reg = ? ORDER BY rowid DESC LIMIT 1',
      args: [flightData.aircraft_reg],
    });
    const existingTechlog = techlogRow.rows[0]?.data ? JSON.parse(techlogRow.rows[0].data as string) : null;
    const syncedTechlog = syncTechlogForNewFlight(existingTechlog, {
      flightNo: finalFlightNo,
      depIata: orig.iata_code || flightData.dep_icao,
      arrIata: dest.iata_code || flightData.arr_icao,
    });
    await db.execute({
      sql: 'INSERT INTO techlogs (flight_id, reg, data) VALUES (?, ?, ?)',
      args: [sessionId, flightData.aircraft_reg, JSON.stringify(syncedTechlog)],
    });

    return NextResponse.json({ success: true, flight_no: finalFlightNo, id: sessionId });

  } catch (error) {
    console.error("SimBrief Integration Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}