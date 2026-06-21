// src/lib/loadsheet/loadsheetHelpers.ts

import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
// 🌟 核心修改：引入總註冊表大腦，全域剷走單一機型
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";

/**
 * 🔍 內部輔助函數：根據目前的飛行數據動態撈出該飛機的 AHM 大腦
 */
const getDynamicAhm = (flightData: any) => {
  const reg = flightData?.aircraft_reg || "B-HNQ";
  return AIRCRAFT_REGISTRY[reg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];
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
// 2. 構建 Loadsheet Engine 所需的 Payload (🌟 動態接收 Taxi Fuel)
// ==========================================
export const buildEnginePayload = (snapshot: any, flightData: any, taxiFuelKg: number) => {
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
      trip: flightData?.fuel_trip_ofp ? Number(flightData.fuel_trip_ofp) * 1000 : 18500,
      isStandard: false,
      tanks: { leftMain: Number(snapshot.fuel?.left)||0, center: Number(snapshot.fuel?.center)||0, rightMain: Number(snapshot.fuel?.right)||0 }
    }
  };
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
  const classCounts: Record<string, number> = { J: 0, W: 0, Y: 0 };
  Object.entries(ahm.stations.pax).forEach(([zoneKey, zoneInfo]: [string, any]) => {
    const short = zoneKey.replace("zone", "");
    const count = Number(snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0);
    const primaryClass = zoneInfo.primaryClass || "Y";
    classCounts[primaryClass] += count;
  });

  const dynamicPaxBreakdown = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls))
    .map(cls => `${cls}${classCounts[cls].toString().padStart(3, '0')}`)
    .join("  "); // 雙空格分隔，民航標準排版

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

${calc?.arrIata || 'KIX'}  ${dynamicPaxBreakdown}
TTL PAX ${w.paxCount.toString().padEnd(5)}  UNDERLOAD   ${marginZFW}

CMDR NAME
SIGN

SI
NOTOC: NO
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
  
  // 🌟 提取 OFP Taxi Fuel (預設 200kg)
  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  
  // 🎯 傳入第 3 個參數：ofpTaxiKg
  const payload = buildEnginePayload(flightData?.azf_snapshot, flightData, ofpTaxiKg);
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
  
  // 🌟 提取 OFP Taxi Fuel
  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  
  // 🎯 傳入第 3 個參數：ofpTaxiKg
  const payload = buildEnginePayload(snapshot, flightData, ofpTaxiKg);
  if (!payload) return "LOADING SNAPSHOT...";
  
  const engine = new LoadsheetEngine(ahm, payload);
  const w = engine.calculateWeights();
  const info = getCommonFlightInfo(flightData, calc);
  
  const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
  
  const classCounts: Record<string, number> = { J: 0, W: 0, Y: 0 };
  Object.entries(ahm.stations.pax).forEach(([zoneKey, zoneInfo]: [string, any]) => {
    const short = zoneKey.replace("zone", "");
    const count = Number(snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0);
    const primaryClass = zoneInfo.primaryClass || "Y";
    classCounts[primaryClass] += count;
  });

  const dynamicEzfwPaxStr = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls))
    .map(cls => `${cls}${classCounts[cls]}`)
    .join("");
  
  return `EZFW ${info.flight_num_clean}/${info.date_str_ezfw} ${info.reg_clean} ${ahm.config}\n${info.crew_fd}/${info.crew_cc} ${calc?.depIata || 'HKG'}${calc?.arrIata || 'KIX'}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${(w.totalPaxWeight + w.totalCargoWeight).toString().padEnd(6)} KG\n\n${dynamicEzfwPaxStr}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${info.dispatcher}\nSI\nLATEST EZFW`;
};