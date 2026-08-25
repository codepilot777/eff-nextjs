// src/lib/loadsheet/loadsheetHelpers.ts

import { LoadsheetEngine, getMainTankCapacity } from "@/lib/loadsheet/LoadsheetEngine";
// 🌟 核心修改：引入總註冊表大腦，全域剷走單一機型
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import type { AircraftAHM560 } from "@/lib/loadsheet/types";

/**
 * 🔍 內部輔助函數：根據目前的飛行數據動態撈出該飛機的 AHM 大腦
 */
export const getDynamicAhm = (flightData: any) => {
  const reg = flightData?.aircraft_reg || "B-HNQ";
  return AIRCRAFT_REGISTRY[reg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];
};

// 🌟 單一嘅「標準 Left/Center/Right 油缸分配」計法，畀 PayloadTab.tsx（教官派發油量）
// 同 ModalAcceptFuel.tsx（trainee 睇返/覆寫標準分配）共用，唔再各自各煮一份
export const distributeFuelKg = (ahm: AircraftAHM560, totalKg: number) => {
  const maxMain = getMainTankCapacity(ahm);
  if (totalKg <= maxMain * 2) {
    const half = Math.round(totalKg / 2);
    return { left: half, center: 0, right: totalKg - half };
  }
  return { left: maxMain, center: totalKg - (maxMain * 2), right: maxMain };
};

// 🌟 單一嘅「有效重量限制」計法，畀 ModalLoadsheet（trainee 可以喺度撳 CUST 設定
// custom_mzfw/custom_mtow/custom_mlaw/custom_mlaw_margin）同 PayloadTab（教官自己
// 嗰邊嘅 Act ZFW 過limit 紅色警示）共用。修復：以前 PayloadTab.tsx 嘅
// engine.checkLimits() 恆定用 ahm.limits 嘅系統原廠上限，完全睇唔到 trainee 喺
// loadsheet 度設定咗嘅 custom 限制——同一班機兩邊見到唔同嘅「過唔過 limit」結論。
export const getEffectiveWeightLimits = (ahm: AircraftAHM560, flightData: Record<string, unknown>) => {
  const isCustomWt = Boolean(flightData?.is_custom_weight);
  const sysMzfw = ahm.limits.MZFW / 1000;
  const sysMtow = ahm.limits.MTOW / 1000;
  const sysMlaw = ahm.limits.MLAW / 1000;

  const dispMzfw = isCustomWt ? (Number(flightData?.custom_mzfw) || sysMzfw) : sysMzfw;
  const dispMtow = isCustomWt ? (Number(flightData?.custom_mtow) || sysMtow) : sysMtow;
  const dispMlaw = isCustomWt ? (Number(flightData?.custom_mlaw) || sysMlaw) : sysMlaw;
  const dispMlawMargin = isCustomWt ? (Number(flightData?.custom_mlaw_margin) || 0.0) : 0.0;
  const effectiveMlaw = dispMlaw - dispMlawMargin;

  return {
    isCustomWt, dispMzfw, dispMtow, dispMlaw, dispMlawMargin, effectiveMlaw,
    // 🌟 KG 版本，方便直接同 LoadsheetEngine.calculateWeights() 嘅 KG 輸出比較
    MZFW: dispMzfw * 1000, MTOW: dispMtow * 1000, MLAW: effectiveMlaw * 1000,
  };
};

// 🔍 動態版本：唔再靠 hardcode 嘅 {J,W,Y} literal，改為由 ahm.config 實際出現嘅
// class letter 做種，再逐個 zone 累加。日後加多個 class 都唔使再喺呢度改 code。
export const buildClassCounts = (ahm: AircraftAHM560, pax: Record<string, unknown> | undefined): Record<string, number> => {
  const counts: Record<string, number> = {};
  (ahm.config.match(/[A-Z](?=\d)/g) || []).forEach((cls: string) => { counts[cls] = 0; });

  Object.entries(ahm.stations.pax).forEach(([zoneKey, zoneInfo]) => {
    const short = zoneKey.replace("zone", "");
    const count = Number(pax?.[short] ?? pax?.[zoneKey] ?? 0);
    const primaryClass = zoneInfo.primaryClass || "Y";
    counts[primaryClass] = (counts[primaryClass] || 0) + count;
  });

  return counts;
};

// ==========================================
// 1. 抽取共用的 Flight / Crew / 基礎資訊 (隨 ahm 動態判定)
// ==========================================
export const getCommonFlightInfo = (flightData: any, calc: any) => {
  const stdUnix = flightData?.std_unix || 0;
  const fpDateObj = stdUnix > 0 ? new Date(stdUnix * 1000) : new Date();
  
  const day_str = fpDateObj.getUTCDate().toString().padStart(2, '0');
  const month_str = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][fpDateObj.getUTCMonth()];
  const year_str = fpDateObj.getUTCFullYear().toString().slice(-2);
  const date_str_ls = `${day_str}${month_str}${year_str}`;
  const date_str_ezfw = `${day_str}${month_str}`;

  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  
  // 🌟 動態同步 AHM 真實註冊號
  const ahm = getDynamicAhm(flightData);
  const reg_clean = ahm.reg.replace("-", "");
  
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;

  return { day_str, date_str_ls, date_str_ezfw, dispatcher, flight_num_clean, reg_clean, crew_fd, crew_cc };
};

// ==========================================
// 2. 構建 Loadsheet Engine 所需的 Payload (🌟 徹底自適應客艙分區)
// ==========================================
// ==========================================
// 2. 構建 Loadsheet Engine 所需的 Payload (🌟 動態接收 Taxi Fuel + Trip Fuel)
// ==========================================
// 🌟 修復：trip 以前恆定讀 flightData.fuel_trip_ofp（原始未修訂嘅 OFP 數），但
// taxiFuelKg 就一直容許外面傳入「revised」嘅即時數（睇 LeftPanel/HistoryPanel 嘅
// revisedTaxiKg）。結果學員一用 ZFW revision / 揀第個 alternate / manual fuel /
// Desired Fuel: On Landing 呢啲會令 fuelCalculator.ts 重新計 trip fuel 嘅功能，
// 呢度個 LAW（Landing Weight = TOW - trip）就同 LeftPanel 顯示緊嘅 Trip Fuel
// 唔同步，令 loadsheet 印出嚟嘅 Landing Weight/LAW margin/L flag 全部用緊舊數。
// 而家同 taxiFuelKg 一樣，要求呼叫方明確傳入想用邊個 trip fuel 數源。
export const buildEnginePayload = (snapshot: any, flightData: any, taxiFuelKg: number, tripFuelKg: number) => {
  if (!snapshot) return null;
  const ahm = getDynamicAhm(flightData);

  const dynamicPaxObj: Record<string, number> = {};
  Object.keys(ahm.stations.pax).forEach(zoneKey => {
    const shortKey = zoneKey.replace("zone", "");
    dynamicPaxObj[zoneKey] = Number(snapshot.pax?.[shortKey]) || Number(snapshot.pax?.[zoneKey]) || 0;
  });

  // 🌟 核心修正：使用從外面傳入來的 taxiFuelKg 來計算真實 Takeoff Fuel
  const blockFuelKg = (Number(snapshot.fuel?.left)||0) + (Number(snapshot.fuel?.center)||0) + (Number(snapshot.fuel?.right)||0);
  const takeoffFuelKg = Math.max(0, blockFuelKg - taxiFuelKg);

  return {
    pax: dynamicPaxObj,
    paxWeights: { J: 85, Y: 81 },
    cargo: { hold1: Number(snapshot.cargo?.h1)||0, hold2: Number(snapshot.cargo?.h2)||0, hold3: Number(snapshot.cargo?.h3)||0, hold4: Number(snapshot.cargo?.h4)||0, bulk: Number(snapshot.cargo?.bulk)||0 },
    waterFraction: Number(flightData?.water_fraction) || 15,
    fuel: {
      takeoff: takeoffFuelKg,
      trip: tripFuelKg,
      isStandard: false,
      tanks: { leftMain: Number(snapshot.fuel?.left)||0, center: Number(snapshot.fuel?.center)||0, rightMain: Number(snapshot.fuel?.right)||0 }
    }
  };
};

// 🌟 單一嘅「而家實際處於邊個階段、嗰個階段真正 dispatch 咗嘅 ZFW/PAX」計法，
// 畀 ModalLoadsheet/LeftPanel.tsx 同 LoadsheetAirportColumn.tsx 共用。修復：以前
// LoadsheetAirportColumn.tsx 自己另外揸住一份邏輯，直接顯示 calc.actualZfw（trainee
// Fuel & Weight 卡度嗰個仲喺度郁緊嘅 live 輸入），令 AZF 真係派發咗 205.3T 之後，
// trainee 之後淨係喺 Revised ZFW 輸入 205.0T（未再派發過任何新文件），個 Dashboard
// 卡就會靜靜雞由 205.3T 變 205.0T——顯示緊一個從未真正 send 出去過嘅數
export const getActiveStageWeights = (flightData: any, calc: any) => {
  const ahm = getDynamicAhm(flightData);

  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  const revisedTaxiKg = calc?.currTaxi ? Math.round(Number(calc.currTaxi) * 1000) : ofpTaxiKg;
  const ofpTripKg = flightData?.fuel_trip_ofp ? Math.round(Number(flightData.fuel_trip_ofp) * 1000) : 18500;
  const revisedTripKg = calc?.currTrip ? Math.round(Number(calc.currTrip) * 1000) : ofpTripKg;

  const computeFrom = (snapshot: any, taxiKg: number, tripKg: number) => {
    const p = buildEnginePayload(snapshot, flightData, taxiKg, tripKg);
    if (!p) return null;
    const e = new LoadsheetEngine(ahm, p);
    const w = e.calculateWeights();
    return { zfw: w.ZFW, pax: w.paxCount };
  };

  if (flightData?.final_ls_sent) {
    const latestFinal = flightData?.final_history?.[flightData.final_history.length - 1];
    const version = latestFinal?.version || 1;
    const w = computeFrom(latestFinal?.snapshot, revisedTaxiKg, revisedTripKg);
    return { stage: "FINAL" as const, version, rejected: !!flightData?.final_ls_rejected, zfw: w?.zfw || 0, pax: w?.pax || 0 };
  }
  if (flightData?.prelim_ls_sent) {
    const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
    const version = latestPrelim?.version || 1;
    const w = computeFrom(latestPrelim?.snapshot, revisedTaxiKg, revisedTripKg);
    return { stage: "PRELIM" as const, version, rejected: !!flightData?.prelim_ls_rejected, zfw: w?.zfw || 0, pax: w?.pax || 0 };
  }
  if (flightData?.azf_sent) {
    const w = computeFrom(flightData.azf_snapshot, ofpTaxiKg, ofpTripKg);
    return { stage: "AZF" as const, version: null, rejected: false, zfw: w?.zfw || 0, pax: w?.pax || 0 };
  }
  if (flightData?.ezfw_sent) {
    const w = computeFrom(flightData.ezfw_snapshot, ofpTaxiKg, ofpTripKg);
    return { stage: "EZFW" as const, version: null, rejected: false, zfw: w?.zfw || 0, pax: w?.pax || 0 };
  }
  return { stage: null, version: null, rejected: false, zfw: 0, pax: 0 };
};

// ==========================================
// 3. 生成 FINAL / PRELIM Loadsheet 文本 (🌟 實現盲盒式自適應排版)
// ==========================================
export const generateLSText = (
  type: string, version: number, snapshot: any, engine: any, payload: any, flightData: any, calc: any, limits: { dispMzfw: number, dispMtow: number, effectiveMlaw: number }
) => {
  if (!engine || !snapshot || !payload) return "";
  const ahm = getDynamicAhm(flightData);
  const info = getCommonFlightInfo(flightData, calc);
  const w = engine.calculateWeights();
  const cg = engine.calculateCG();
  
  // 🎯 動態解耦：將 ahm.config 正確加上美化空格（例如 "J45W48Y268" -> "J45 W48 Y268"）
  const formattedConfig = ahm.config.replace(/([A-Z])(\d+)/g, "$1$2 ").trim();

  // 🎯 動態生成客艙分布排版（例如：0A/020 0B/042 0C/015 ...）
  const dynamicPaxLine = Object.keys(ahm.stations.pax).map(zoneKey => {
    const short = zoneKey.replace("zone", "");
    const count = snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0;
    return `${short}/${count.toString().padEnd(3)}`;
  }).join(" ");

  // 🎯 核心修改：動態生成目的地詳細艙等縮寫清單（商業艙等，例如 J042  W024  Y150）
  const classCounts = buildClassCounts(ahm, snapshot.pax);

  const dynamicPaxBreakdown = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls))
    .map(cls => `${cls}${classCounts[cls].toString().padStart(3, '0')}`)
    .join("  "); // 雙空格分隔，民航標準排版

  // 🌟 NOTOC 危險品清單以前淨係喺 SI 段見到「NOTOC: YES - SEE ATTACHED」，
  // loadsheet 本身冇顯示邊格 hold 實際裝緊邊件 DG——真實排版會喺 Cargo HOLD
  // loading 嗰行落面即刻跟一行 ".<IMP CODE>/<POSITION>" 逐件連埋（例如
  // ".RFL/24P.ICE/31P"），冇 DG 就冇呢行（同以前一樣淨係得返個空行分隔）
  const notocItems = flightData?.notoc?.items || [];
  const dgLine = notocItems.map((item: any) => `.${item.imp_code}/${item.position}`).join('');

  const marginZFW = (limits.dispMzfw * 1000) - w.ZFW;
  const marginTOW = (limits.dispMtow * 1000) - w.TOW;
  const marginLAW = (limits.effectiveMlaw * 1000) - w.LAW;
  const minMargin = Math.min(marginZFW, marginTOW, marginLAW);
  const lZfw = marginZFW === minMargin ? "L" : " ";
  const lTow = marginTOW === minMargin ? "L" : " ";
  const lLaw = marginLAW === minMargin ? "L" : " ";

  return `LDS/${info.reg_clean}/${info.flight_num_clean}
LOADSHEET                   ${type}  ${version.toString().padStart(2, '0')}
${info.flight_num_clean}/${info.date_str_ls}
${calc?.depIata || 'HKG'}  ${calc?.arrIata || 'KIX'}  ${info.flight_num_clean}/${info.day_str}                ${info.reg_clean}
${formattedConfig.padEnd(21)}${info.crew_fd}/${info.crew_cc}                ${info.date_str_ls}

ZFW ACT ${w.ZFW.toString().padEnd(8)}  MAX ${limits.dispMzfw * 1000}  ${lZfw}   ${marginZFW}
TO FUEL ${payload.fuel.takeoff.toString().padEnd(8)}
TOW ACT ${w.TOW.toString().padEnd(8)}  MAX ${limits.dispMtow * 1000}  ${lTow}   ${marginTOW}
TRIP FUEL ${payload.fuel.trip.toString().padEnd(8)}
LAW ACT ${w.LAW.toString().padEnd(8)}  MAX ${limits.effectiveMlaw * 1000}  ${lLaw}   ${marginLAW}

BALANCE AND SEATING
BW  ${ahm.basicData.BW}      DOW ${w.DOW}
BI  ${ahm.basicData.BI.toFixed(2)}      DOI 741.09
LIZFW   ${cg.LIZFW.toFixed(2)}  MACZFW  ${cg.MACZFW.toFixed(2)}
LITOW   ${cg.LITOW.toFixed(2)}  MATOW   ${cg.MACTOW.toFixed(2)}
LILAW   ${cg.LILAW.toFixed(2)}  MACLAW  ${cg.MACLAW.toFixed(2)}

STAB TO ${cg.stabTrim}
${dynamicPaxLine}
T${(w.totalCargoWeight).toString().padEnd(5)} .1/${snapshot.cargo.h1.toString().padEnd(4)} .2/${snapshot.cargo.h2.toString().padEnd(4)} .3/${snapshot.cargo.h3.toString().padEnd(4)} .4/${snapshot.cargo.h4.toString().padEnd(4)} .5/${snapshot.cargo.bulk.toString().padEnd(4)}
${dgLine}
${calc?.arrIata || 'KIX'}  ${dynamicPaxBreakdown}
TTL PAX ${w.paxCount.toString().padEnd(5)}  UNDERLOAD   ${minMargin}

CMDR NAME
SIGN

SI
NOTOC: ${flightData?.notoc?.hasDg ? 'YES - SEE ATTACHED' : 'NO'}
PANTRY CODE:        ${ahm.acType === "B77W" ? "77J-A" : "77P-A"}
SERVICE WEIGHT ADJUSTMENT/INDEX ADD
POTABLE WATER       ${flightData?.water_fraction || 15}/16   ${Math.round(((flightData?.water_fraction || 15)/16)*100)}  PCT

NORMAL MACTOW LIMITS:
FWD MACTOW LIMIT        14.1
AFT MACTOW LIMIT        38.6
LOADSHEETER/${info.dispatcher}/HKG1576`;
};

// ==========================================
// 4. 生成 AZF 文本
// ==========================================
export const getAzfText = (flightData: any, calc: any) => {
  const ahm = getDynamicAhm(flightData);
  
  // 🌟 提取 OFP Taxi Fuel (預設 200kg) + OFP Trip Fuel——AZF 係早期文件，同 taxi 一樣
  // 特登唔用即時 revised 數，保持起飛前呢個時間點嘅原始 OFP 基準
  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  const ofpTripKg = flightData?.fuel_trip_ofp ? Math.round(Number(flightData.fuel_trip_ofp) * 1000) : 18500;

  const payload = buildEnginePayload(flightData?.azf_snapshot, flightData, ofpTaxiKg, ofpTripKg);
  if (!payload) return "LOADING SNAPSHOT...";
  
  const engine = new LoadsheetEngine(ahm, payload);
  const w = engine.calculateWeights();
  const info = getCommonFlightInfo(flightData, calc);
  
  // 🌟 取用已扣減 Taxi Fuel 嘅真實 TOW
  const tow_reqd = Math.round(w.ZFW + (calc?.currReqdBase || 0) * 1000 - ofpTaxiKg);
  return `AZF/${info.reg_clean}/${info.flight_num_clean}\n- PAX/ ${w.paxCount}\n- CGO/ ${w.totalCargoWeight}\n- ZFW/ ${w.ZFW}\n- CRW/ ${info.crew_fd}/${info.crew_cc}\n- TOW/ ${tow_reqd}\n- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}\n- SEC/ ${calc?.depIata || 'HKG'}-${calc?.arrIata || 'KIX'}\n\nFLT STATUS: closed\nLCO: ${info.dispatcher}\n\nSI`;
};

// ==========================================
// 5. 生成 EZFW 文本
// ==========================================
export const getEzfwText = (flightData: any, calc: any) => {
  const ahm = getDynamicAhm(flightData);
  const snapshot = flightData?.ezfw_snapshot;
  
  // 🌟 提取 OFP Taxi Fuel + OFP Trip Fuel——EZFW 同 AZF 一樣係早期文件，保持原始 OFP 基準
  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  const ofpTripKg = flightData?.fuel_trip_ofp ? Math.round(Number(flightData.fuel_trip_ofp) * 1000) : 18500;

  const payload = buildEnginePayload(snapshot, flightData, ofpTaxiKg, ofpTripKg);
  if (!payload) return "LOADING SNAPSHOT...";
  
  const engine = new LoadsheetEngine(ahm, payload);
  const w = engine.calculateWeights();
  const info = getCommonFlightInfo(flightData, calc);
  
  const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
  
  const classCounts = buildClassCounts(ahm, snapshot.pax);

  const dynamicEzfwPaxStr = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls))
    .map(cls => `${cls}${classCounts[cls]}`)
    .join("");
  
  return `EZFW ${info.flight_num_clean}/${info.date_str_ezfw} ${info.reg_clean} ${ahm.config}\n${info.crew_fd}/${info.crew_cc} ${calc?.depIata || 'HKG'}${calc?.arrIata || 'KIX'}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${(w.totalPaxWeight + w.totalCargoWeight).toString().padEnd(6)} KG\n\n${dynamicEzfwPaxStr}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${info.dispatcher}\nSI\nLATEST EZFW`;
};

// ==========================================
// 6. Dashboard reconciliation：真正由 payload 計出嚟嘅 weights，得閒先有
// ==========================================
// 🌟 修復：FINAL/PRELIM 由始至終都冇寫過 flightData.final_snapshot/prelim_snapshot
// 呢兩個扁平欄位（PayloadTab.tsx 淨係識得 push 落 final_history/prelim_history 陣列），
// 所以以前呢個 helper 對 FINAL/PRELIM 階段嘅航班恆定讀唔到嘢，靜靜雞跌落去用
// azf_snapshot/ezfw_snapshot 嘅舊數。而家改為由歷史陣列攞返「最後發送」嗰份真正 snapshot。
export const getLatestSnapshot = (flightData: Record<string, unknown>) => {
  const finalHistory = flightData?.final_history as Array<{ snapshot?: unknown }> | undefined;
  const prelimHistory = flightData?.prelim_history as Array<{ snapshot?: unknown }> | undefined;
  const latestFinal = finalHistory?.[finalHistory.length - 1]?.snapshot;
  const latestPrelim = prelimHistory?.[prelimHistory.length - 1]?.snapshot;
  return latestFinal || latestPrelim || flightData?.azf_snapshot || flightData?.ezfw_snapshot || null;
};

// 🌟 喺學員未真正發送過任何 payload 文件之前，返 null（唔好夾硬計一個假數出嚟）
// 🌟 calc 係可選——有就用返 fuelCalculator.ts 即時 revised 嘅 trip fuel（同 ModalLoadsheet
// FINAL/PRELIM 階段一致嘅計法），冇就 fallback 落靜態 OFP trip fuel
export const getEngineWeights = (flightData: Record<string, unknown>, calc?: { currTrip?: number }) => {
  const snapshot = getLatestSnapshot(flightData);
  if (!snapshot) return null;

  const ahm = getDynamicAhm(flightData);
  const taxiFuelKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  const ofpTripKg = flightData?.fuel_trip_ofp ? Math.round(Number(flightData.fuel_trip_ofp) * 1000) : 18500;
  const tripFuelKg = calc?.currTrip ? Math.round(Number(calc.currTrip) * 1000) : ofpTripKg;

  const payload = buildEnginePayload(snapshot, flightData, taxiFuelKg, tripFuelKg);
  if (!payload) return null;

  const engine = new LoadsheetEngine(ahm, payload);
  const w = engine.calculateWeights();
  const cg = engine.calculateCG();

  return {
    zfw: w.ZFW / 1000, tow: w.TOW / 1000, law: w.LAW / 1000,
    macTow: cg.MACTOW, macLaw: cg.MACLAW,
  };
};