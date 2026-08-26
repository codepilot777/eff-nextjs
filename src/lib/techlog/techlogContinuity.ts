// src/lib/techlog/techlogContinuity.ts

// 🌟 單一嘅「未有 techlog row 之前嘅預設值」，畀 GET /api/techlog（trainee 未寫過任何嘢
// 之前嘅 fallback）同 syncTechlogForNewFlight（起機嗰刻嘅 continuity sync）共用，
// 唔再各自維護一份，慢慢走樣
export const DEFAULT_TECHLOG: Record<string, unknown> = {
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

  // 🌟 Maintenance Release (CRS) 簽發編號
  crs_id: "CRS-9412-X",

  // 🌟 當前航班嘅 Pre-flight Engineering Action Log
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

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatTechlogDate(d: Date): string {
  return `${d.getUTCDate().toString().padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function hhmm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}${m.toString().padStart(2, '0')}`;
}

export interface NewFlightContinuityParams {
  flightNo: string;
  depIata: string;
  arrIata: string;
}

// 🌟 起機嗰刻，如果要補 continuity gap，一次過生成幾多條 bridging sector——單單一條
// 「positioning flight」睇落太突兀（架機憑空跳咗過去），一條有返 10 程嘅小歷史先似樣
const BRIDGE_HISTORY_DEPTH = 10;

const REGIONAL_STATION_POOL = ["HKG", "SIN", "KIX", "BKK", "TPE", "NGO", "NRT", "ICN", "PVG", "MNL", "CGK", "KUL"];
const COMMANDER_POOL = ["LEE M H", "CHEUNG W S", "WONG K K", "HO Y T", "CHAN T M", "NG S F", "TSANG P K", "YIP C W", "MAK K L", "FUNG T Y"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStationExcluding(exclude: string): string {
  const pool = REGIONAL_STATION_POOL.filter((s) => s !== exclude);
  return pickRandom(pool.length > 0 ? pool : REGIONAL_STATION_POOL);
}

const HUB = "HKG";

// 🌟 生成一條互相銜接嘅歷史 sector 鏈（新至舊排，index 0 最新）：最新一條嘅 arrival
// 啱啱好等於 endStation（同新起嗰個 flight plan 接得上），最舊一條嘅 departure 啱啱好
// 等於 startStation（同原有 techlog 記錄嘅「上一個已知位置」接得上），中間逐程互相銜接。
// 🌟 修復：以前 departure 淨係用 randomStationExcluding(arrival) 揀，淨係保證唔同
// 上一程重複，冇強制一定要沾到 HKG——會生成成串成日喺 outstation 之間飛嘅 sector
// （例如 SIN ➔ KIX），但呢架機係 HKG-based fleet，逐程都應該係「由 HKG 出去」或者
// 「返返嚟 HKG」，唔會有兩個 outstation 直接互飛。而家改成逐程都強制一邊係 HKG：
// 上一程去到 HKG，呢程就要由 HKG 出走去第個 outstation；上一程喺 outstation，
// 呢程就要飛返 HKG
function buildChainedHistorySectors(count: number, startStation: string, endStation: string, mostRecentDate: Date, fallbackCmdr: string): Array<Record<string, unknown>> {
  const sectors: Array<Record<string, unknown>> = [];
  let arrival = endStation;
  let date = new Date(mostRecentDate);

  for (let i = 0; i < count; i++) {
    let departure: string;
    if (i === count - 1) {
      // 最舊一條要同原有 techlog 記錄嘅「上一個已知位置」接得上，但都唔可以打破
      // 「逐程一定沾到 HKG」——如果 startStation 同上一程嘅 arrival 都唔係 HKG
      // （罕見邊緣情況），寧願強制呢程由 HKG 出走，都好過生成一程兩個 outstation 互飛
      departure = (startStation === HUB || arrival === HUB) ? startStation : HUB;
    } else if (arrival === HUB) {
      departure = randomStationExcluding(HUB);
    } else {
      departure = HUB;
    }

    const blocksOffMin = 60 + Math.floor(Math.random() * 600);
    const takeOffMin = blocksOffMin + 15;
    const flightDurMin = 60 + Math.floor(Math.random() * 180);
    const landingMin = takeOffMin + flightDurMin;
    const blocksOnMin = landingMin + 10;

    const upliftT = (12 + Math.random() * 20).toFixed(1);
    const arrFuelT = (5 + Math.random() * 8).toFixed(1);
    const hasMinorDefect = Math.random() > 0.85;

    sectors.push({
      id: `SEC-${date.getTime().toString().slice(-6)}${i}`,
      date: formatTechlogDate(date),
      action: "Normal Close",
      flt: `CX${100 + Math.floor(Math.random() * 800)}`,
      route: `${departure} ➔ ${arrival}`,
      blocksOff: hhmm(blocksOffMin),
      takeOff: hhmm(takeOffMin),
      landing: hhmm(landingMin),
      blocksOn: hhmm(blocksOnMin),
      def: hasMinorDefect ? [{ id: `S${1000 + Math.floor(Math.random() * 9000)}`, status: "CLEARED", description: "Minor cabin equipment defect rectified." }] : [],
      checks: [Math.random() > 0.7 ? "Daily Check" : "Transit Check"],
      serv: ["Nil Servicing Required"],
      fuelUp: upliftT,
      fuelArr: arrFuelT,
      cmdr: i === 0 ? (fallbackCmdr || pickRandom(COMMANDER_POOL)) : pickRandom(COMMANDER_POOL),
      landingsCount: "1", overshoots: "0", touchGo: "0",
      edto: "No", autoland: "Not Attempted",
    });

    arrival = departure;
    date = new Date(date.getTime() - (12 + Math.random() * 24) * 3600 * 1000);
  }

  return sectors;
}

// 🌟 起機（SimBrief import）嗰刻自動將呢架機嘅 techlog「Prepare Flight」預設值（下一程去邊）
// 同新起嗰個 flight plan 同步，唔使 trainee 再自己入 e-techlog 手動改。每次起機都無條件
// 生成一條由 BRIDGE_HISTORY_DEPTH 程 sector 組成嘅小歷史落 flights（唔止喺 continuity
// gap 先補）——最舊一條仍然由原有 techlog 記錄嘅「上一個已知位置」開始銜接，令成個
// flights 歷史保持連貫，但每次起機都刷新返一輪睇落似真正累積落嚟嘅機隊歷史
//
// 🌟 同時每次起機都強制：
// 1. Engineer 嘅 release checklist（fluids/checks/defects/release）打晒 ✓——新一輪訓練
//    session 開始，架機理應已經俾 engineer release 咗
// 2. 上一個 sector 顯示做 closed（history 鏈最新一條 action 恆定 "Normal Close"）
// 3. Trainee 嘅 workflow state 清返做未 prepare（tl_prepared/tl_accept/tl_flight_started
//    reset false，tl_flight_status 返做 SCHEDULED）——唔會因為上一個 session 遺留低嘅
//    「已經 prepared/accepted 緊」狀態，令 trainee 打開嚟見唔到 Prepare Flight 呢個
//    應該係第一步嘅 pending action
export function syncTechlogForNewFlight(
  existingTechlog: Record<string, unknown> | null,
  params: NewFlightContinuityParams
): Record<string, unknown> {
  const base: Record<string, unknown> = existingTechlog ? { ...existingTechlog } : { ...DEFAULT_TECHLOG };
  const newDep = (params.depIata || 'HKG').toUpperCase();
  const newArr = (params.arrIata || 'N/A').toUpperCase();
  const currentLocation = String(base.tl_prev_arr || DEFAULT_TECHLOG.tl_prev_arr || 'HKG').toUpperCase();

  base.tl_prep_flt = params.flightNo;
  base.tl_prep_dep = newDep;
  base.tl_prep_arr = newArr;

  base.tl_fluids = true;
  base.tl_checks = true;
  base.tl_defects = true;
  base.tl_release = true;

  base.tl_prepared = false;
  // 🌟 修復：以前呢度冇 reset tl_fuel_record_completed，令上一程留低嘅
  // 「已經填過 fuel record」狀態帶入新一程——trainee 一撳完 Prepare Flight，
  // 左邊 nav bar 見到嘅 pending action 就跳咗過 Fuel Record 直接去
  // Commander's Acceptance（TechLogLeftPanel.tsx 個 !isFuelDone 分支睇到嘅
  // 係舊嗰程遺留低嘅 true）
  base.tl_fuel_record_completed = false;
  base.tl_accept = false;
  base.tl_flight_started = false;
  base.tl_flight_status = "SCHEDULED";

  const chain = buildChainedHistorySectors(BRIDGE_HISTORY_DEPTH, currentLocation, newDep, new Date(), String(base.tl_cmdr || ''));
  const newest = chain[0];
  const newestDeparture = String(newest.route).split(' ➔ ')[0];

  base.flights = [...chain, ...((base.flights as unknown[]) || [])];
  base.tl_prev_flt = newest.flt;
  base.tl_prev_dep = newestDeparture;
  base.tl_prev_arr = newDep;
  base.tl_prev_fob = newest.fuelArr;

  return base;
}
