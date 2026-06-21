"use client";
import { useState, Fragment } from "react";
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
// 🌟 引入你的終極註冊表大腦
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";

export function ModalLoadsheet({ flightData, updateFlightData, calc, setActiveModal }: any) {
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 AHM 大腦
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 從 OFP 提取 UTC 時間作為文檔日期
  const stdUnix = flightData?.std_unix || 0;
  const fpDateObj = stdUnix > 0 ? new Date(stdUnix * 1000) : new Date();
  
  const day_str = fpDateObj.getUTCDate().toString().padStart(2, '0');
  const month_str = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][fpDateObj.getUTCMonth()];
  const year_str = fpDateObj.getUTCFullYear().toString().slice(-2);
  const date_str_ls = `${day_str}${month_str}${year_str}`;
  const date_str_ezfw = `${day_str}${month_str}`;

  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  const reg_clean = ahm.reg.replace("-", ""); // 🌟 隨 AHM 自動變更
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;

  const paxTot = calc?.paxTot || 0;

  // 🌟 Weight Limits 邏輯動態自適應
  const sysMtow = ahm.limits.MTOW / 1000;
  const sysMlaw = ahm.limits.MLAW / 1000;
  const sysMzfw = ahm.limits.MZFW / 1000;

  const isCustomWt = flightData?.is_custom_weight || false;
  const dispMtow = isCustomWt ? (flightData?.custom_mtow || sysMtow) : sysMtow;
  const dispMlaw = isCustomWt ? (flightData?.custom_mlaw || sysMlaw) : sysMlaw;
  const dispMlawMargin = isCustomWt ? (flightData?.custom_mlaw_margin || 0.0) : 0.0;
  const dispMzfw = isCustomWt ? (flightData?.custom_mzfw || sysMzfw) : sysMzfw;

  // 計算最終生效的 MLAW (扣除 Margin)
  const effectiveMlaw = dispMlaw - dispMlawMargin;

  // 🌟 核心重構：Payload 轉換器徹底動態化，遍歷 AHM 的客艙所有 Zone
  const buildEnginePayload = (snapshot: any) => {
    if (!snapshot) return null;

    const dynamicPaxObj: Record<string, number> = {};
    Object.keys(ahm.stations.pax).forEach(zoneKey => {
      const shortKey = zoneKey.replace("zone", ""); // 兼容舊版 "OA" 或新版 "zoneOA" 命名
      dynamicPaxObj[zoneKey] = Number(snapshot.pax?.[shortKey]) || Number(snapshot.pax?.[zoneKey]) || 0;
    });

    return {
      pax: dynamicPaxObj,
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

  // 🌟 判斷當前 Stage 狀態與獲取該 Stage 的 ZFW / PAX
  let currentStage = "AWAITING";
  let stageZfw = 0;
  let stagePax = 0;
  let stageBg = "bg-[#333333]";
  let stageText = "text-[#8fa0a6]";

  if (flightData?.final_ls_sent) {
    currentStage = `FINAL ${(flightData?.final_ls_version || 1).toString().padStart(2, '0')}`;
    stageBg = flightData?.pilots_signed_final ? "bg-[#C6FF00]" : "bg-[#2979FF]"; 
    stageText = flightData?.pilots_signed_final ? "text-black" : "text-white";
    const p = buildEnginePayload(flightData.final_snapshot);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  } else if (flightData?.prelim_ls_sent) {
    currentStage = `PRELIM ${(flightData?.prelim_ls_version || 1).toString().padStart(2, '0')}`;
    stageBg = "bg-[#FF9100]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.prelim_snapshot);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  } else if (flightData?.azf_sent) {
    currentStage = "AZF";
    stageBg = "bg-[#00E676]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.azf_snapshot);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  } else if (flightData?.ezfw_sent) {
    currentStage = "EZFW";
    stageBg = "bg-[#00bfa5]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.ezfw_snapshot);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  }

  // 🌟 核心亮點：Loadsheet 艙單文字工廠全自動動態拼裝！
  const generateLSText = (type: string, version: number, snapshot: any, engine: any, payload: any) => {
    if (!engine || !snapshot || !payload) return "";
    const w = engine.calculateWeights();
    const cg = engine.calculateCG();
    
    const marginZFW = (dispMzfw * 1000) - w.ZFW;
    const marginTOW = (dispMtow * 1000) - w.TOW;
    const marginLAW = (effectiveMlaw * 1000) - w.LAW;
    const minMargin = Math.min(marginZFW, marginTOW, marginLAW);
    const lZfw = marginZFW === minMargin ? "L" : " ";
    const lTow = marginTOW === minMargin ? "L" : " ";
    const lLaw = marginLAW === minMargin ? "L" : " ";

    // 🎯 動態生成客艙人數段落 (例如 "OA/020 OB/042 OC/015 ...")
    const dynamicPaxLine = Object.keys(ahm.stations.pax).map(zoneKey => {
      const short = zoneKey.replace("zone", "");
      const count = snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0;
      return `${short}/${count.toString().padEnd(3)}`;
    }).join(" ");

    // 🎯 動態生成總人數後的艙等縮寫段落
    const dynamicPaxBreakdown = Object.keys(ahm.stations.pax).map(zoneKey => {
      const short = zoneKey.replace("zone", "");
      const count = snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0;
      return `${short}${count.toString().padStart(3, '0')}`;
    }).join("  ");

    return `LDS/${reg_clean}/${flight_num_clean}
LOADSHEET                   ${type}  ${version.toString().padStart(2, '0')}
${flight_num_clean}/${date_str_ls}
${calc?.depIata || 'HKG'}  ${calc?.arrIata || 'KIX'}  ${flight_num_clean}/${day_str}                ${reg_clean}
${ahm.config.slice(0,3)} ${ahm.config.slice(3)}      ${crew_fd}/${crew_cc}                ${date_str_ls}

ZFW ACT ${w.ZFW.toString().padEnd(8)}  MAX ${dispMzfw * 1000}  ${lZfw}   ${marginZFW}
TO FUEL ${payload.fuel.takeoff.toString().padEnd(8)}
TOW ACT ${w.TOW.toString().padEnd(8)}  MAX ${dispMtow * 1000}  ${lTow}   ${marginTOW}
TRIP FUEL ${payload.fuel.trip.toString().padEnd(8)}
LAW ACT ${w.LAW.toString().padEnd(8)}  MAX ${effectiveMlaw * 1000}  ${lLaw}   ${marginLAW}

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
LOADSHEETER/${dispatcher}/HKG1576`;
  };

  const renderHighlightedFinal = (newText: string, oldText: string) => {
    if (!oldText || !newText) return newText;
    const newLines = newText.split('\n');
    const oldLines = oldText.split('\n');

    return newLines.map((line, i) => {
      const oLine = oldLines[i] || '';
      if (line === oLine) return <div key={i}>{line || " "}</div>;
      
      const nTokens = line.split(/(\s+)/);
      const oTokens = oLine.split(/(\s+)/);

      return (
        <div key={i}>
          {nTokens.map((token, j) => {
            if (token.trim() !== '' && token !== oTokens[j]) {
              return <span key={j} className="text-[#0a0a0a] bg-[#FF9100] px-0.5 rounded shadow-[0_0_8px_rgba(255,145,0,0.8)] font-black">{token}</span>;
            }
            return <Fragment key={j}>{token}</Fragment>;
          })}
        </div>
      );
    });
  };

  const getAzfText = () => {
    const azfPayload = buildEnginePayload(flightData?.azf_snapshot);
    if (!azfPayload) return "LOADING SNAPSHOT...";
    const azfEngine = new LoadsheetEngine(ahm, azfPayload);
    const w = azfEngine.calculateWeights();
    const tow_reqd = Math.round(w.ZFW + (calc?.currReqdBase || 0) * 1000);
    return `AZF/${reg_clean}/${flight_num_clean}\n- PAX/ ${w.paxCount}\n- CGO/ ${w.totalCargoWeight}\n- ZFW/ ${w.ZFW}\n- CRW/ ${crew_fd}/${crew_cc}\n- TOW/ ${tow_reqd}\n- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}\n- SEC/ ${calc?.depIata || 'HKG'}-${calc?.arrIata || 'KIX'}\n\nFLT STATUS: closed\nLCO: ${dispatcher}\n\nSI`;
  };

  const getEzfwText = () => {
    const ezfwPayload = buildEnginePayload(flightData?.ezfw_snapshot);
    if (!ezfwPayload) return "LOADING SNAPSHOT...";
    const ezfwEngine = new LoadsheetEngine(ahm, ezfwPayload);
    const w = ezfwEngine.calculateWeights();
    const snapshot = flightData.ezfw_snapshot;
    const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);

    // 🎯 動態拼裝 EZFW 的客艙人數縮寫 (例如 "OA020OB042...")
    const dynamicEzfwPaxStr = Object.keys(ahm.stations.pax).map(zoneKey => {
      const short = zoneKey.replace("zone", "");
      const count = snapshot.pax?.[short] || snapshot.pax?.[zoneKey] || 0;
      return `${short}${count}`;
    }).join("");
    
    return `EZFW ${flight_num_clean}/${date_str_ezfw} ${reg_clean} ${dynamicEzfwPaxStr}\n${crew_fd}/${crew_cc} ${calc?.depIata || 'HKG'}${calc?.arrIata || 'KIX'}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${(w.totalPaxWeight + w.totalCargoWeight).toString().padEnd(6)} KG\n\n${dynamicEzfwPaxStr}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${dispatcher}\nSI\nLATEST EZFW`;
  };

  // 動態獲取頂部 Header 所需的客艙數據字串
  const getHeaderPaxBreakdown = (snapshotSource: any) => {
    return Object.keys(ahm.stations.pax).map(zoneKey => {
      const short = zoneKey.replace("zone", "");
      let count = 0;
      if (snapshotSource) {
        count = snapshotSource.pax?.[short] || snapshotSource.pax?.[zoneKey] || 0;
      } else {
        // 補底：若無快照則讀取 flightData 標準欄位
        const keys = Object.keys(ahm.stations.pax);
        if (zoneKey === keys[0]) count = flightData?.pax_f || 0;
        else if (zoneKey === keys[1]) count = flightData?.pax_j || 0;
        else if (zoneKey === keys[2]) count = flightData?.pax_w || 0;
        else if (zoneKey === keys[3]) count = flightData?.pax_y || 0;
      }
      return `${short}${count.toString().padStart(2, '0')}`;
    }).join(" ");
  };

  const desiredFuelType = flightData?.desired_fuel_type || 'NONE';
  const desiredFuelVal = flightData?.desired_fuel_value || '';

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative font-sans">
      
      {/* ========================================== */}
      {/* 左邊：狀態與 Revised Weights 面板 */}
      {/* ========================================== */}
      <div className="w-[300px] shrink-0 flex flex-col h-full bg-[#1E1E1E] rounded-2xl border border-[#333333] p-5 shadow-lg mr-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        
        {/* Stage Indicator */}
        <div className="mb-6">
          <div className={`text-center font-black text-[1.1rem] py-2.5 rounded-lg ${stageBg} ${stageText} uppercase tracking-widest shadow-md transition-colors`}>
            {currentStage}
          </div>
          
          <div className="flex justify-between mt-3 text-sm font-mono text-[#8fa0a6]">
            <div className="flex flex-col items-center bg-[#0a0a0a] py-2 px-1 rounded-lg border border-[#333] w-[48%] shadow-inner">
              <span className="text-[0.65rem] uppercase font-bold tracking-widest mb-0.5">PAX</span>
              <span className="text-white text-[1.3rem] font-bold leading-none">{stagePax > 0 ? stagePax : '--'}</span>
            </div>
            <div className="flex flex-col items-center bg-[#0a0a0a] py-2 px-1 rounded-lg border border-[#333] w-[48%] shadow-inner">
              <span className="text-[0.65rem] uppercase font-bold tracking-widest mb-0.5">ZFW (KG)</span>
              <span className="text-white text-[1.3rem] font-bold leading-none">{stageZfw > 0 ? stageZfw : '--'}</span>
            </div>
          </div>
        </div>

        {/* Revised Weights & Fuel 表格 */}
        <div className="text-[1.05rem] font-bold text-white border-b border-[#333] pb-3 mb-4 uppercase shrink-0">Weights & Fuel</div>
        <div className="flex-1 min-h-0 pb-4">
          <table className="w-full text-[0.85rem] font-mono">
            <tbody>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Trip Fuel</td><td className="text-right font-bold text-white">{(calc?.autoTrip || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Contingency</td><td className="text-right font-bold text-white">{(calc?.currCont || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Alternate</td><td className="text-right font-bold text-white">{(calc?.currAltnOfp || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Reserve</td><td className="text-right font-bold text-white">{(calc?.ofpRes || 0).toFixed(1)} T</td></tr>
              <tr className="border-b border-[#333]"><td className="text-[#8fa0a6] py-1.5 font-sans">Min Reqd</td><td className="text-right font-bold text-[#8fa0a6]">{(calc?.currReqdBase || 0).toFixed(1)} T</td></tr>
              
              <tr><td className="text-[#8fa0a6] py-1.5 pt-2 font-sans flex items-center gap-1">Extra Fuel {calc?.currExtra > 0 && <span className="bg-[#FF9100] text-black px-1 rounded text-[0.5rem] leading-tight font-black">AUTO</span>}</td><td className="text-right font-bold text-[#FF9100] pt-2">{(calc?.currExtra || 0).toFixed(1)} T</td></tr>
              <tr className="border-b border-[#333]"><td className="text-[#00E676] py-2 font-sans font-bold">Total Block</td><td className="text-right font-black text-[#00E676] text-[1.1rem]">{(calc?.currTotal || 0).toFixed(1)} T</td></tr>
              
              <tr><td className="text-[#8fa0a6] py-1.5 pt-4 font-sans">Zero Fuel Wt</td><td className="text-right font-bold pt-4 text-white">{(calc?.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Takeoff Wt</td><td className="text-right font-bold text-white">{(calc?.currTow || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Landing Wt</td><td className="text-right font-bold text-white">{(calc?.currLw || 0).toFixed(1)} T</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 右邊：上下結構 (Header & History) */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* 右邊上半截：飛機資訊 + Setup & Limits */}
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333333] p-6 shadow-lg mb-4 shrink-0 flex flex-row relative overflow-hidden">
          
          <svg className="absolute -bottom-16 -right-10 w-[350px] h-[350px] text-[#ffffff] opacity-[0.03] transform -rotate-[25deg] pointer-events-none" fill="currentColor" viewBox="0 0 512 512">
            <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"/>
          </svg>

          {/* 左半：飛機與座位資訊 */}
          <div className="flex-[0.8] relative z-10 flex flex-col justify-center">
            <div className="flex items-end gap-6 mb-3">
              <span className="text-[2.8rem] font-black text-white tracking-wider leading-none drop-shadow-md">{reg_clean}</span>
              <div className="flex flex-col mb-1.5">
                 <span className="text-[#8fa0a6] font-bold text-[0.65rem] uppercase tracking-widest leading-none mb-1">CREW</span>
                 <span className="text-white font-mono font-bold text-lg leading-none">FD{crew_fd} <span className="text-[#8fa0a6]">/</span> C{crew_cc}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
              <div className="flex items-center gap-2">
                 <span>PAX</span>
                 <span className="text-white text-xl font-mono">{paxTot}</span>
              </div>
              {/* 🌟 亮點修改：隨不同 Stage 歷史或空重，動態渲染 F J W Y E 等分區徽章 */}
              <div className="flex items-center gap-2 bg-[#0a0a0a] px-2 py-1 rounded border border-[#333]">
                 <span className="text-white font-mono text-xs">
                   {getHeaderPaxBreakdown(flightData?.final_ls_sent ? flightData.final_snapshot : (flightData?.prelim_ls_sent ? flightData.prelim_snapshot : null))}
                 </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-bold text-[#8fa0a6] uppercase tracking-widest">
              <div className="flex items-center gap-2">
                 <span>CAP</span>
                 <span className="text-white text-xl font-mono">{Object.values(ahm.stations.pax).reduce((a,b)=>a+b.maxPax, 0)}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#333] text-white px-2 py-1 rounded">
                 <span className="font-mono text-xs">
  {Object.entries(ahm.stations.pax).map(([k, zoneData]: [string, any]) => `${k.replace("zone","")}${zoneData.maxPax}`).join(" ")}
</span>
              </div>
            </div>
          </div>

          {/* 右半：Setup & Limits 操控區 */}
          <div className="w-[500px] shrink-0 relative z-10 border-l border-[#333] pl-6 ml-2 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[0.95rem] font-bold text-white uppercase tracking-widest">Weight Limit</span>
              <div onClick={() => updateFlightData({is_custom_weight: !isCustomWt, final_fuel_accepted: false})} className="flex items-center gap-1.5 cursor-pointer bg-[#0a0a0a] border border-[#333] rounded-full px-2 py-1 hover:bg-[#252525] transition-colors">
                <span className={`text-[0.55rem] font-bold uppercase tracking-wider pl-0.5 leading-none transition-colors ${!isCustomWt ? 'text-[#00E676]' : 'text-[#555]'}`}>SYS</span>
                <div className={`w-6 h-3.5 rounded-full relative transition-colors duration-300 ${isCustomWt ? 'bg-[#FF9100]' : 'bg-[#555]'}`}>
                   <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-300 ${isCustomWt ? 'translate-x-[12px]' : 'translate-x-[2px]'}`}></div>
                </div>
                <span className={`text-[0.55rem] font-bold uppercase tracking-wider pr-0.5 leading-none transition-colors ${isCustomWt ? 'text-[#FF9100]' : 'text-[#555]'}`}>CUST</span>
              </div>
            </div>
            
            <div className="flex items-stretch gap-3">
              <div className="flex-1 bg-[#0a0a0a] p-3 rounded-xl border border-[#333] shadow-inner flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-[1.2] flex flex-col gap-1">
                     <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Desired Fuel</label>
                     <select 
                       value={desiredFuelType}
                       onChange={(e) => updateFlightData({ desired_fuel_type: e.target.value, final_fuel_accepted: false })}
                       className="bg-[#1a1a1a] text-white text-[0.75rem] font-bold rounded p-1.5 outline-none border border-[#444] focus:border-[#00E676] cursor-pointer appearance-none transition-colors"
                     >
                       <option value="NONE">Min Legal (Def)</option>
                       <option value="OFF_BLOCK">Off Block</option>
                       <option value="ON_LANDING">On Landing</option>
                     </select>
                  </div>
                  <div className={`flex-[0.8] flex flex-col gap-1 transition-opacity ${desiredFuelType === 'NONE' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                     <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Value</label>
                     <div className="flex items-center gap-1">
                       <input 
                         type="number" step="0.1" defaultValue={desiredFuelVal}
                         onBlur={(e) => updateFlightData({ desired_fuel_value: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false })}
                         className="w-full bg-[#1a1a1a] text-[#00E676] text-[0.85rem] font-black rounded p-1.5 outline-none border border-[#444] focus:border-[#00E676] transition-colors text-right"
                       />
                       <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                     </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-[#222] pt-3">
                  <div className="flex flex-col gap-1 justify-center">
                     <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">LW Margin</label>
                     <div className="flex items-center gap-1">
                       <input 
                         key={`margin-${isCustomWt}`} type="number" step="0.1" disabled={!isCustomWt} defaultValue={dispMlawMargin.toFixed(1)} 
                         onBlur={(e)=> updateFlightData({custom_mlaw_margin: parseFloat(e.target.value), final_fuel_accepted: false})} 
                         className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-1.5 outline-none border transition-colors text-center ${isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                       />
                       <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-end">
                     <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MTOW</label>
                     <div className="flex items-center gap-1">
                       <input 
                         key={`mtow-${isCustomWt}`} type="number" step="0.1" disabled={!isCustomWt} defaultValue={dispMtow.toFixed(1)} 
                         onBlur={(e)=> updateFlightData({custom_mtow: parseFloat(e.target.value), final_fuel_accepted: false})} 
                         className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-1.5 outline-none border transition-colors text-right ${isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                       />
                       <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                     </div>
                  </div>

                  <div className="col-start-2 flex flex-col gap-1 items-end">
                     <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MLAW</label>
                     <div className="flex items-center gap-1">
                       <input 
                         key={`mlaw-${isCustomWt}`} type="number" step="0.1" disabled={!isCustomWt} defaultValue={dispMlaw.toFixed(1)} 
                         onBlur={(e)=> updateFlightData({custom_mlaw: parseFloat(e.target.value), final_fuel_accepted: false})} 
                         className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-1.5 outline-none border transition-colors text-right ${isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                       />
                       <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="w-[60px] flex flex-col items-center justify-center gap-1 border-l border-[#333] pl-3">
                 <label className="text-[0.6rem] text-[#8fa0a6] uppercase tracking-widest font-bold text-center leading-tight">MZFW</label>
                 <div className="flex flex-col items-center gap-0.5 w-full">
                   <input 
                     key={`mzfw-${isCustomWt}`} type="number" step="0.1" disabled={!isCustomWt} defaultValue={dispMzfw.toFixed(1)} 
                     onBlur={(e)=> updateFlightData({custom_mzfw: parseFloat(e.target.value), final_fuel_accepted: false})} 
                     className={`w-full bg-transparent text-[0.95rem] font-black rounded outline-none border-b text-center px-0 py-1 transition-colors ${isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                   />
                   <span className="text-[#8fa0a6] font-bold text-[0.55rem]">Tons</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 右邊下半截：文檔歷史滾動區 (Documents History) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
          <div className="flex gap-5 w-max h-full min-h-0">
            
            {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.ezfw_sent && !flightData?.azf_sent) && (
              <div className="text-[#8fa0a6] p-8 text-center italic w-full flex items-center justify-center font-sans text-sm">
                No load documents dispatched yet.
              </div>
            )}

            {/* FINAL LOADSHEET 歷史列表 */}
            {[...(flightData?.final_history || [])].reverse().map((doc: any, reverseIndex: number) => {
              const isLatest = reverseIndex === 0;
              const isRejected = !isLatest || flightData?.final_ls_rejected;
              const payloadObj = buildEnginePayload(doc.snapshot);
              const engine = new LoadsheetEngine(ahm, payloadObj!);
              const text = generateLSText("FINAL", doc.version, doc.snapshot, engine, payloadObj);
              const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
              let pText = "";
              if (latestPrelim && isLatest) {
                const pPayload = buildEnginePayload(latestPrelim.snapshot);
                const pEngine = new LoadsheetEngine(ahm, pPayload!);
                pText = generateLSText("PRELIM", latestPrelim.version, latestPrelim.snapshot, pEngine, pPayload);
              }

              return (
                <div key={`final-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
                  {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="text-[#FF1744]/20 font-black text-6xl transform -rotate-45 border-8 border-[#FF1744]/20 p-4 rounded-2xl">REJECTED</div></div>}
                  
                  <h4 className="text-[#2979FF] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">FINAL {doc.version.toString().padStart(2, '0')}</h4>
                  
                  <div className="mt-3 mb-3 shrink-0 relative z-20">
                    {isLatest ? (
                      flightData?.final_ls_rejected ? (
                        <button disabled className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">FINAL (V{doc.version}) REJECTED</button>
                      ) : flightData?.pilots_signed_final ? (
                        <div className="w-full py-2.5 bg-[#C6FF00] text-black rounded-lg font-bold text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">✓ Acknowledged by {flightData?.captain || 'COMMANDER'}</div>
                      ) : (
                        <button onClick={() => setShowFinalConfirm(true)} className="w-full py-2.5 bg-[#2979FF] text-white rounded-lg font-black text-[0.7rem] hover:bg-blue-600 shadow-md uppercase tracking-widest transition-colors">Accept Final V{doc.version.toString().padStart(2, '0')}</button>
                      )
                    ) : (
                      <button disabled className="w-full py-2.5 bg-[#0a0a0a] border border-[#333] text-[#666] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">SUPERSEDED</button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto mt-1 min-h-0 relative z-20 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                    <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">
                      {pText ? renderHighlightedFinal(text, pText) : text}
                    </pre>
                  </div>
                </div>
              );
            })}

            {/* PRELIM LOADSHEET 歷史列表 */}
            {[...(flightData?.prelim_history || [])].reverse().map((doc: any, reverseIndex: number) => {
              const isLatest = reverseIndex === 0;
              const isRejected = !isLatest || flightData?.prelim_ls_rejected;
              const payloadObj = buildEnginePayload(doc.snapshot);
              const engine = new LoadsheetEngine(ahm, payloadObj!);
              const text = generateLSText("PRELIM", doc.version, doc.snapshot, engine, payloadObj);

              return (
                <div key={`prelim-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
                  {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="text-[#FF1744]/20 font-black text-6xl transform -rotate-45 border-8 border-[#FF1744]/20 p-4 rounded-2xl">REJECTED</div></div>}

                  <h4 className="text-[#FF9100] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">PRELIM {doc.version.toString().padStart(2, '0')}</h4>
                  
                  <div className="mt-3 mb-3 shrink-0 relative z-20">
                    {isLatest ? (
                      flightData?.prelim_ls_rejected ? (
                        <button disabled className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">WAITING FOR REVISION...</button>
                      ) : (
                        <button onClick={() => setActiveModal('RejectPrelim')} className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] hover:bg-[#FF1744] hover:text-white uppercase tracking-widest transition-colors">Reject PRELIM (V{doc.version})</button>
                      )
                    ) : (
                      <button disabled className="w-full py-2.5 bg-[#0a0a0a] border border-[#333] text-[#666] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">SUPERSEDED</button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto mt-1 min-h-0 relative z-20 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                    <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{text}</pre>
                  </div>
                </div>
              );
            })}

            {flightData?.azf_sent && (
              <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
                <h4 className="text-[#00E676] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">AZF DATASHEET</h4>
                <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                  <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getAzfText()}</pre>
                </div>
              </div>
            )}

            {flightData?.ezfw_sent && (
              <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
                <h4 className="text-white border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">EZFW DATASHEET</h4>
                <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                  <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getEzfwText()}</pre>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* 確認彈窗 Sub-Modal */}
      {showFinalConfirm && (
        <div className="absolute inset-[-1.5rem] z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in rounded-2xl">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-[340px] p-6 shadow-2xl flex flex-col relative">
            <button onClick={() => setShowFinalConfirm(false)} className="absolute top-4 right-4 text-[#8fa0a6] hover:text-white font-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333]">✕</button>
            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed font-sans">
              Confirm the data of loadsheet<br/>
              <span className="text-[#2979FF] text-xl font-black block mt-2">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</span>
            </p>
            <div className="flex flex-col gap-3 font-sans">
              <button onClick={() => { setShowFinalConfirm(false); updateFlightData({ pilots_signed_final: true }); }} className="w-full bg-[#C6FF00] text-black font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg shadow-md hover:bg-[#b0e600] transition-colors">Accept</button>
              <button onClick={() => { setShowFinalConfirm(false); setActiveModal('RejectFinal'); }} className="w-full text-[#FF1744] bg-[#FF1744]/10 border border-[#FF1744]/50 font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg hover:bg-[#FF1744] hover:text-white transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}