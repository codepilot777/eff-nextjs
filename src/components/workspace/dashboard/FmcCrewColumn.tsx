"use client";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

export default function FmcCrewColumn({ setActiveModal }: { setActiveModal: any }) {
  
  // 🌟 1. 從天上直接抽取 Data
  const { flightData } = useFlightData();

  if (!flightData) return null;

  // =====================================================================
  // 🌟 2. 數據大解構 (動態運算大升級)
  // =====================================================================
  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const orig = rawSb.origin || {};
  const dest = rawSb.destination || {};

  const acType = flightData?.aircraft_type || gen.icao_aircraft || 'B773';
  const reg = flightData?.aircraft_reg || gen.aircraft_reg || 'B-HNQ';
  const routeStr = flightData?.route_id || gen.route || 'DCT';
  const shortRoute = routeStr.split(" ").length > 5 ? routeStr.split(" ").slice(0, 5).join(" ") + " ..." : routeStr;
  const costIndex = flightData?.cost_index || (gen.costindex ? `CI ${gen.costindex}` : 'CI 85');
  const totalDist = flightData?.ground_dist || gen.route_distance || '1000';
  const dragFf = flightData?.drag_ff || 'P0.0 / P0.0';
  const melCdl = flightData?.mel_cdl || 'NIL';
  
  // 起飛/降落 跑道與 SID/STAR
  const depRwy = flightData?.dep_rwy || orig.plan_rwy || 'NIL';
  const arrRwy = flightData?.arr_rwy || dest.plan_rwy || 'NIL';
  const sid = flightData?.sid_route || gen.sid_ident || 'NIL';
  const star = flightData?.star_route || gen.star_ident || 'NIL';

  // 1. 高度格式化
  let rawCruiseAlt = flightData?.cruise_alt || gen.initial_altitude || '35000';
  let cruiseAlt = rawCruiseAlt;
  if (rawCruiseAlt && typeof rawCruiseAlt === 'string') {
      if (rawCruiseAlt.length >= 4) cruiseAlt = `FL${rawCruiseAlt.substring(0, 3)}`;
      else if (!rawCruiseAlt.startsWith('FL')) cruiseAlt = `FL${rawCruiseAlt}`;
  }

  // 2. 風向格式化
  let windStr = flightData?.avg_wind || gen.avg_wind_comp || 'N/A';
  if (windStr !== 'N/A' && typeof windStr === 'string' && !windStr.startsWith('P') && !windStr.startsWith('M')) {
    const numWind = parseInt(windStr);
    if (!isNaN(numWind)) windStr = (numWind >= 0 ? 'P' : 'M') + Math.abs(numWind).toString().padStart(3, '0');
  }
  const avgWind = windStr;

  // 3. 安全計算 Avg Trip (kg/gnm)
  const tripFuel = parseInt(rawSb.fuel?.enroute_burn || '0');
  const distNum = parseInt(totalDist);
  const avgTrip = (tripFuel > 0 && distNum > 0) ? (tripFuel / distNum).toFixed(1) : '16.9';

  // 4. 安全提取 Reserve 同 Alternate Fuel
  const resFuelKg = parseInt(rawSb.fuel?.reserve || '0');
  const altnFuelKg = parseInt(rawSb.fuel?.alternate_burn || '0') + resFuelKg;
  const resFuelTons = resFuelKg > 0 ? (resFuelKg / 1000).toFixed(1) : '2.0';
  const altnFuelTons = altnFuelKg > 0 ? (altnFuelKg / 1000).toFixed(1) : '3.5';

  // 其他雜項與備降場
  const edto = flightData?.edto || "NIL";
  const minDivertAlt = flightData?.arr_icao === 'RJBB' ? 'RJGG' : (rawSb.alternate?.[0]?.icao_code || 'ALTN');

  // =====================================================================
  // 🌟 3. 師兄神提議：頂配動態高級航電運算（TOC OAT & Highest MRA）
  // =====================================================================
  const rawNavlogArray = rawSb.navlog?.fix || [];
  const waypointList = Array.isArray(rawNavlogArray) ? rawNavlogArray : [rawNavlogArray];

  // 🎯 運算 A: 獲取 TOC 航點的 OAT 溫度
  // 尋找 SimBrief 航點入面 ident 叫做 "TOC" 嘅航點，並抽佢嘅 oat (Outside Air Temp)
  const tocWaypoint = waypointList.find((fix: any) => fix.ident === "TOC");
  let tocTemp = "M45"; // 預設 Fallback 數值
  if (tocWaypoint?.oat) {
    const oatNum = parseInt(tocWaypoint.oat);
    if (!isNaN(oatNum)) {
      // 航空格式：負數用 M (Minus)，正數用 P (Plus)
      tocTemp = (oatNum >= 0 ? 'P' : 'M') + Math.abs(oatNum).toString();
    }
  }

  // 🎯 運算 B: 獲取所有 Waypoint 最高嘅 MORA 並動態除以 100 顯示
  let highestMoraValue = 30; // 預設最低基礎
  waypointList.forEach((fix: any) => {
    const moraNum = parseInt(fix.mora_feet || fix.mora);
    if (!isNaN(moraNum) && moraNum > highestMoraValue) {
      highestMoraValue = moraNum;
    }
  });

  // 依照師兄要求：減去最後 2 個 0 (即係除以 100)。例如 14700 呎會變成 147 顯示
  const tripMraNum = highestMoraValue >= 100 ? Math.floor(highestMoraValue / 100) : highestMoraValue;
  const tripMraStr = tripMraNum.toString();

  // 判斷是否超過 100。如果超過 100 (即真實高度大於 10,000 呎)，觸發 Amber Highlight 樣式
  const isMraOver100 = tripMraNum > 100;

  // 機長名
  const cmdrName = flightData?.commander_override || "SCOTT HILHORST";

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden font-sans text-white w-full max-w-[280px]">
      
      {/* 🌟 1. FMC & ATS 卡片 */}
      <div 
        onClick={() => setActiveModal('FMS')}
        className="bg-[#1E1E1E] rounded-xl p-3 flex flex-col flex-[2] min-h-0 cursor-pointer hover:bg-[#252525] transition-colors relative shadow-lg"
      >
        <div className="flex justify-between items-center mb-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">FMC & ATS</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 content-between min-h-0 flex-1 pt-1 pb-1">
          
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Aircraft Type</span>
            <span className="font-mono text-[0.8rem] leading-none">{acType}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Reg</span>
            <span className="font-mono text-[0.8rem] leading-none">{reg}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Drag/F-F Factor</span>
            <span className="font-mono text-[0.8rem] leading-none">{dragFf}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">MEL/CDL Pen</span>
            <span className="font-mono text-[0.8rem] leading-none">{melCdl}</span>
          </div>

          <div className="flex flex-col col-span-1 pr-2">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">FMS Route</span>
            <span className="font-mono text-[0.8rem] text-white truncate w-full block leading-none">{shortRoute}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Total Distance</span>
            <span className="font-mono text-[0.8rem] leading-none">{totalDist} NM</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">TOC</span>
            <span className="font-mono text-[0.8rem] leading-none">{cruiseAlt.replace('F', '')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">TOC Temp</span>
            {/* 🌟 成功聯動：動態讀取 SimBrief 實時 TOC 溫度 */}
            <span className="font-mono text-[0.8rem] leading-none">{tocTemp}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Cruise Schedule</span>
            <span className="font-mono text-[0.8rem] leading-none">{costIndex}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">EDTO Flight</span>
            <span className="font-mono text-[0.8rem] leading-none">{edto}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Reserve</span>
            <span className="font-mono text-[0.8rem] leading-none">{resFuelTons}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Min Divert Fuel</span>
            <span className="font-mono text-[0.8rem] leading-none truncate">{minDivertAlt} {altnFuelTons}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Avg Wind</span>
            <span className="font-mono text-[0.8rem] leading-none">{avgWind}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Avg Trip (kg/gnm)</span>
            <span className="font-mono text-[0.8rem] leading-none">{avgTrip}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Highest Trip MRA</span>
            {/* 🌟 成功聯動：動態計算全航線最高 MORA 呎數，並完美支援 Amber Highlight 閃爍警告 */}
            <div className={`text-[0.7rem] font-black px-1.5 rounded w-max flex items-center gap-1 shadow-md leading-tight transition-all ${
              isMraOver100 
                ? "bg-[#FF9100] text-black animate-pulse font-black" // 超過 100 出現標誌性 Amber 閃爍警告！
                : "text-white" // 正常狀態
            }`}>
              <span className="text-[0.45rem]">▲</span> {tripMraStr}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">EDG MRA</span>
            {/* 🌟 成功聯動：動態計算全航線最高 MORA 呎數，並完美支援 Amber Highlight 閃爍警告 */}
            <div className={`text-[0.7rem] font-black px-1.5 rounded w-max flex items-center gap-1 shadow-md leading-tight transition-all ${
              isMraOver100 
                ? "bg-[#FF9100] text-black animate-pulse font-black" // 超過 100 出現標誌性 Amber 閃爍警告！
                : "text-white" // 正常狀態
            }`}>
              <span className="text-[0.45rem]">▲</span> {tripMraStr}
            </div>
          </div>

          <div className="flex flex-col pr-2">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Dep Rwy / SID</span>
            <span className="font-mono text-[0.8rem] leading-none truncate block">{depRwy} / {sid}</span>
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Arr Rwy / STAR</span>
            <span className="font-mono text-[0.8rem] leading-none truncate block">{arrRwy} / {star}</span>
          </div>

        </div>
      </div>
      
      {/* 🌟 2. SNN & DOCS 按鈕 */}
      <div className="flex gap-2 shrink-0">
        <button 
          onClick={() => setActiveModal('SNN')} 
          className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-xl py-2 px-3 text-[#8fa0a6] font-bold text-[0.8rem] flex items-center justify-center hover:text-white hover:border-[#555] shadow-md transition-all"
        >
          SNN
        </button>
        <button 
          onClick={() => setActiveModal('DOCS')} 
          className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-xl py-2 px-3 text-[#8fa0a6] font-bold text-[0.8rem] flex items-center justify-center hover:text-white hover:border-[#555] shadow-md transition-all"
        >
          DOCS
        </button>
      </div>

      {/* 🌟 3. Crew 列表卡片 */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[0.8] flex flex-col min-h-0 overflow-hidden shadow-lg">
        <div className="flex justify-between items-center mb-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Crew</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between font-mono text-[0.8rem] pr-1 py-1">
          <div className="flex justify-between items-center text-white leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-[0.65rem]">✓</span>
              <span className="truncate max-w-[120px]">{cmdrName}</span>
            </div>
            <span className="text-[#8fa0a6] text-[0.7rem] bg-[#333] px-1.5 rounded">T-CN</span>
          </div>
          
          <div className="flex justify-between items-center text-white leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-[0.65rem]">✓</span>
              <span>MARTIN LEE</span>
            </div>
            <span className="text-[#8fa0a6] text-[0.7rem] bg-[#333] px-1.5 rounded">T-FO</span>
          </div>

          <div className="w-full border-t border-[#333] my-1"></div>

          <div className="flex justify-between items-center text-[#8fa0a6] leading-none opacity-50">
            <div className="flex items-center gap-2">
              <span className="text-[#0a0a0a] text-[0.6rem]">⊗</span>
              <span>MARTIN LEE</span>
            </div>
            <span className="text-[0.7rem]">U-IM</span>
          </div>
        </div>
      </div>
    </div>
  );
}