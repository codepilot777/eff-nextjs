"use client";

export function ModalFMS({ calc, flightData }: any) {
  
  if (!flightData) return null;

  // =====================================================================
  // 🌟 數據大解構 (同 Dashboard FmcCrewColumn 完全同步)
  // =====================================================================
  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const orig = rawSb.origin || {};
  const dest = rawSb.destination || {};

  const acType = flightData?.aircraft_type || gen.icao_aircraft || 'B773';
  const reg = flightData?.aircraft_reg || gen.aircraft_reg || 'B-HNQ';
  const routeStr = flightData?.route_id || gen.route || 'DCT';
  const costIndex = flightData?.cost_index || (gen.costindex ? `CI ${gen.costindex}` : 'CI 85');
  const totalDist = flightData?.ground_dist || gen.route_distance || '1000';
  const dragFf = flightData?.drag_ff || 'P0.0 / P0.0';
  const melCdl = flightData?.mel_cdl || 'NIL';
  
  const depRwy = flightData?.dep_rwy || orig.plan_rwy || 'NIL';
  const arrRwy = flightData?.arr_rwy || dest.plan_rwy || 'NIL';
  const sid = flightData?.sid_route || gen.sid_ident || 'NIL';
  const star = flightData?.star_route || gen.star_ident || 'NIL';
  const depIcao = flightData?.dep_icao || orig.icao_code || 'VHHH';
  const arrIcao = flightData?.arr_icao || dest.icao_code || 'VHHH';

  // 高度格式化
  let rawCruiseAlt = flightData?.cruise_alt || gen.initial_altitude || '35000';
  let cruiseAlt = rawCruiseAlt;
  if (rawCruiseAlt && typeof rawCruiseAlt === 'string') {
      if (rawCruiseAlt.length >= 4) cruiseAlt = `FL${rawCruiseAlt.substring(0, 3)}`;
      else if (!rawCruiseAlt.startsWith('FL')) cruiseAlt = `FL${rawCruiseAlt}`;
  }

  // 風向格式化
  let windStr = flightData?.avg_wind || gen.avg_wind_comp || 'N/A';
  if (windStr !== 'N/A' && typeof windStr === 'string' && !windStr.startsWith('P') && !windStr.startsWith('M')) {
    const numWind = parseInt(windStr);
    if (!isNaN(numWind)) windStr = (numWind >= 0 ? 'P' : 'M') + Math.abs(numWind).toString().padStart(3, '0');
  }
  const avgWind = windStr;

  // 安全油量與數據
  const tripFuel = parseInt(rawSb.fuel?.enroute_burn || '0');
  const distNum = parseInt(totalDist);
  const avgTrip = (tripFuel > 0 && distNum > 0) ? (tripFuel / distNum).toFixed(1) : '16.9';

  const resFuelKg = parseInt(rawSb.fuel?.reserve || '0');
  const altnFuelKg = parseInt(rawSb.fuel?.alternate_burn || '0') + resFuelKg;
  const resFuelTons = resFuelKg > 0 ? (resFuelKg / 1000).toFixed(1) : '2.0';
  const altnFuelTons = altnFuelKg > 0 ? (altnFuelKg / 1000).toFixed(1) : '3.5';

  const edto = flightData?.edto || "NIL";
  const minDivertAlt = flightData?.arr_icao === 'RJBB' ? 'RJGG' : (rawSb.alternate?.[0]?.icao_code || 'ALTN');

  // =====================================================================
  // 🌟 TOC OAT & MRA 動態高級航電運算
  // =====================================================================
  const rawNavlogArray = rawSb.navlog?.fix || [];
  const waypointList = Array.isArray(rawNavlogArray) ? rawNavlogArray : [rawNavlogArray];

  // 🎯 TOC Temp 運算
  const tocWaypoint = waypointList.find((fix: any) => fix.ident === "TOC");
  let tocTemp = "M45";
  if (tocWaypoint?.oat) {
    const oatNum = parseInt(tocWaypoint.oat);
    if (!isNaN(oatNum)) {
      tocTemp = (oatNum >= 0 ? 'P' : 'M') + Math.abs(oatNum).toString();
    }
  }

  // 🎯 Highest MRA 運算
  let highestMoraValue = 30;
  waypointList.forEach((fix: any) => {
    const moraNum = parseInt(fix.mora_feet || fix.mora);
    if (!isNaN(moraNum) && moraNum > highestMoraValue) {
      highestMoraValue = moraNum;
    }
  });

  const tripMraNum = highestMoraValue >= 100 ? Math.floor(highestMoraValue / 100) : highestMoraValue;
  const tripMraStr = tripMraNum.toString();
  const isMraOver100 = tripMraNum > 100; // 🌟 判斷大於 100

  // 🎯 EDG MRA 運算
  const edgMraStr = flightData?.edg_mra || "159";
  const edgMraParsed = parseInt(edgMraStr);
  const isEdgMraOver100 = !isNaN(edgMraParsed) && edgMraParsed > 100; // 🌟 判斷大於 100

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden min-h-0 w-full font-sans">
      
      {/* ========================================== */}
      {/* 左邊：FMS OPERATION SUMMARY (🌟 比例改為 3) */}
      {/* ========================================== */}
      <div className="flex-[3] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 flex flex-col min-h-0 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-5 border-b border-[#333] pb-3 shrink-0 tracking-wide">FMS OPERATION SUMMARY</h2>
        
        <div className="grid grid-cols-2 gap-y-5 gap-x-6 overflow-y-auto pr-2 content-start min-h-0 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
          
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Aircraft Type</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{acType}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Reg</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{reg}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Drag/F-F Factor</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{dragFf}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">MEL/CDL Pen</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{melCdl}</span>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">FMS Route</span>
            <span className="font-mono text-[0.9rem] leading-relaxed break-words mt-0.5">{routeStr}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Total Distance</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{totalDist} NM</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">TOC</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{cruiseAlt.replace('FL', '')}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">TOC Temp</span>
            <span className="font-mono text-[0.9rem] leading-none mt-0.5">{tocTemp}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Cost Index</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{costIndex}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">EDTO Flight</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{edto}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Reserve</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{resFuelTons} T</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Min Divert Fuel</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{minDivertAlt} {altnFuelTons}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Avg Wind</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{avgWind}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Avg Trip (kg/gnm)</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{avgTrip}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Highest Trip MRA</span>
            {/* 🌟 大於 100 先變 Amber，否則普通白字 */}
            {isMraOver100 ? (
              <div className="bg-[#FF9100] text-black text-[0.75rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm animate-pulse leading-tight mt-0.5">
                <span className="text-[0.5rem]">▲</span> {tripMraStr}
              </div>
            ) : (
              <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{tripMraStr}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">EDG MRA</span>
            {/* 🌟 大於 100 先變 Amber，否則普通白字 */}
            {isMraOver100 ? (
              <div className="bg-[#FF9100] text-black text-[0.75rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm animate-pulse leading-tight mt-0.5">
                <span className="text-[0.5rem]">▲</span> {tripMraStr}
              </div>
            ) : (
              <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{tripMraStr}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Dep Rwy</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{depRwy}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Arr Rwy</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{arrRwy}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">SID</span>
            <span className="font-mono text-[0.9rem] leading-none mt-0.5">{sid}</span>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">STAR</span>
            <span className="font-mono text-[0.9rem] leading-none mt-0.5">{star}</span>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* 右邊：ICAO ATS FLIGHT PLAN (🌟 比例改為 7) */}
      {/* ========================================== */}
      <div className="flex-[7] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 flex flex-col min-h-0 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-5 border-b border-[#333] pb-3 shrink-0 tracking-wide">ICAO ATS FLIGHT PLAN</h2>
        
        {/* ATS 電報模擬區 */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] font-mono text-[0.85rem] text-[#e2e8f0] whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner">
          {flightData?.raw_simbrief?.atc?.flightplan_text || `(FPL-${flightData?.flight_no?.replace(" ", "") || 'CPA564'}-IS
-B773/H-SDE3GHIJ2J3J5M1RWXY/LB1
-${depIcao}${flightData?.std_z?.substring(0,4) || '0000'}
-N0480F${cruiseAlt.replace('FL', '')} ${routeStr} ${flightData?.sid_route || ''} DCT OCEAN DCT MKG DCT ${flightData?.star_route || ''}
-${arrIcao}0315 ${depIcao}
-REG/${reg.replace("-", "")} CAPT/${flightData?.commander_override?.replace(" ", "") || 'PILOT'})`}
        </div>
      </div>

    </div>
  );
}