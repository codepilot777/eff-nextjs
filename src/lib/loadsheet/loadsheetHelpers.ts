import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM";

// ==========================================
// 1. 抽取共用的 Flight / Crew / 基礎資訊
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
  const reg_clean = calc?.reg?.replace("-", "") || "BHNQ";
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;

  return { day_str, date_str_ls, date_str_ezfw, dispatcher, flight_num_clean, reg_clean, crew_fd, crew_cc };
};

// ==========================================
// 2. 構建 Loadsheet Engine 所需的 Payload
// ==========================================
export const buildEnginePayload = (snapshot: any, flightData: any) => {
  if (!snapshot) return null;
  return {
    pax: { zoneOA: Number(snapshot.pax?.OA)||0, zoneOB: Number(snapshot.pax?.OB)||0, zoneOC: Number(snapshot.pax?.OC)||0, zoneOD: Number(snapshot.pax?.OD)||0 },
    paxWeights: { J: 85, Y: 81 }, 
    cargo: { hold1: Number(snapshot.cargo?.h1)||0, hold2: Number(snapshot.cargo?.h2)||0, hold3: Number(snapshot.cargo?.h3)||0, hold4: Number(snapshot.cargo?.h4)||0, bulk: Number(snapshot.cargo?.bulk)||0 },
    waterFraction: Number(flightData?.water_fraction) || 15, 
    fuel: {
      takeoff: (Number(snapshot.fuel?.left)||0) + (Number(snapshot.fuel?.center)||0) + (Number(snapshot.fuel?.right)||0),
      trip: flightData?.fuel_trip_ofp ? Number(flightData.fuel_trip_ofp) * 1000 : 18500,
      isStandard: false,
      tanks: { leftMain: Number(snapshot.fuel?.left)||0, center: Number(snapshot.fuel?.center)||0, rightMain: Number(snapshot.fuel?.right)||0 }
    }
  };
};

// ==========================================
// 3. 生成 FINAL / PRELIM Loadsheet 文本
// ==========================================
export const generateLSText = (
  type: string, version: number, snapshot: any, engine: any, payload: any, flightData: any, calc: any, limits: { dispMzfw: number, dispMtow: number, effectiveMlaw: number }
) => {
  if (!engine || !snapshot || !payload) return "";
  const info = getCommonFlightInfo(flightData, calc);
  const w = engine.calculateWeights();
  const cg = engine.calculateCG();
  
  // 🌟 從 Snapshot 獲取真實 PAX 數據
  const paxJ = snapshot.pax.OA || 0;
  const paxY = (snapshot.pax.OB || 0) + (snapshot.pax.OC || 0) + (snapshot.pax.OD || 0);

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
F00 J42 W00 Y396      ${info.crew_fd}/${info.crew_cc}                ${info.date_str_ls}

ZFW ACT ${w.ZFW.toString().padEnd(8)}  MAX ${limits.dispMzfw * 1000}  ${lZfw}   ${marginZFW}
TO FUEL ${payload.fuel.takeoff.toString().padEnd(8)}
TOW ACT ${w.TOW.toString().padEnd(8)}  MAX ${limits.dispMtow * 1000}  ${lTow}   ${marginTOW}
TRIP FUEL ${payload.fuel.trip.toString().padEnd(8)}
LAW ACT ${w.LAW.toString().padEnd(8)}  MAX ${limits.effectiveMlaw * 1000}  ${lLaw}   ${marginLAW}

BALANCE AND SEATING
BW  ${B773_BHNQ.basicData.BW}      DOW ${w.DOW}
BI  ${B773_BHNQ.basicData.BI.toFixed(2)}      DOI 741.09
LIZFW   ${cg.LIZFW.toFixed(2)}  MACZFW  ${cg.MACZFW.toFixed(2)}
LITOW   ${cg.LITOW.toFixed(2)}  MATOW   ${cg.MACTOW.toFixed(2)}
LILAW   ${cg.LILAW.toFixed(2)}  MACLAW  ${cg.MACLAW.toFixed(2)}

STAB TO ${cg.stabTrim}
0A/${snapshot.pax.OA.toString().padEnd(3)} 0B/${snapshot.pax.OB.toString().padEnd(3)} 0C/${snapshot.pax.OC.toString().padEnd(3)} 0D/${snapshot.pax.OD.toString().padEnd(3)}
T${(w.totalCargoWeight).toString().padEnd(5)} .1/${snapshot.cargo.h1.toString().padEnd(4)} .2/${snapshot.cargo.h2.toString().padEnd(4)} .3/${snapshot.cargo.h3.toString().padEnd(4)} .4/${snapshot.cargo.h4.toString().padEnd(4)} .5/${snapshot.cargo.bulk.toString().padEnd(4)}

${calc?.arrIata || 'KIX'}  F000 J${paxJ.toString().padStart(3,'0')} W000 Y${paxY.toString().padStart(3,'0')}
TTL PAX ${w.paxCount.toString().padEnd(5)}  UNDERLOAD   ${marginZFW}

CMDR NAME
SIGN

SI
NOTOC: NO
PANTRY CODE:        77P-A
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
  const payload = buildEnginePayload(flightData?.azf_snapshot, flightData);
  if (!payload) return "LOADING SNAPSHOT...";
  const engine = new LoadsheetEngine(B773_BHNQ, payload);
  const w = engine.calculateWeights();
  const info = getCommonFlightInfo(flightData, calc);
  
  const tow_reqd = Math.round(w.ZFW + (calc?.currReqdBase || 0) * 1000);
  return `AZF/${info.reg_clean}/${info.flight_num_clean}\n- PAX/ ${w.paxCount}\n- CGO/ ${w.totalCargoWeight}\n- ZFW/ ${w.ZFW}\n- CRW/ ${info.crew_fd}/${info.crew_cc}\n- TOW/ ${tow_reqd}\n- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}\n- SEC/ ${calc?.depIata || 'HKG'}-${calc?.arrIata || 'KIX'}\n\nFLT STATUS: closed\nLCO: ${info.dispatcher}\n\nSI`;
};

// ==========================================
// 5. 生成 EZFW 文本
// ==========================================
export const getEzfwText = (flightData: any, calc: any) => {
  const snapshot = flightData?.ezfw_snapshot;
  const payload = buildEnginePayload(snapshot, flightData);
  if (!payload) return "LOADING SNAPSHOT...";
  const engine = new LoadsheetEngine(B773_BHNQ, payload);
  const w = engine.calculateWeights();
  const info = getCommonFlightInfo(flightData, calc);
  
  const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
  
  // 🌟 從 Snapshot 獲取真實 PAX 數據
  const paxJ = snapshot.pax?.OA || 0;
  const paxY = (snapshot.pax?.OB || 0) + (snapshot.pax?.OC || 0) + (snapshot.pax?.OD || 0);
  
  return `EZFW ${info.flight_num_clean}/${info.date_str_ezfw} ${info.reg_clean} F0J${paxJ}W0Y${paxY}\n${info.crew_fd}/${info.crew_cc} ${calc?.depIata || 'HKG'}${calc?.arrIata || 'KIX'}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${(w.totalPaxWeight + w.totalCargoWeight).toString().padEnd(6)} KG\n\nF0 J${paxJ} W0 Y${paxY}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${info.dispatcher}\nSI\nLATEST EZFW`;
};