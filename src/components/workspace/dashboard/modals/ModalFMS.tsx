"use client";

import { useState } from "react";

export function ModalFMS({ flightData }: any) {

  // 🌟 Highlight Route：每 tap 一下就累積 highlight 多一個 route token（由 SID 開始，
  // 一路去到 STAR 為止），畀 trainee 睇住條 route 逐步「畫」出嚟，好似真正 FMC 咁樣
  const [highlightCount, setHighlightCount] = useState(0);

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

  // =====================================================================
  // 🌟 Highlight Route：將 ATS flight plan 文字拆做 token，搵出由 SID 到 STAR
  // 之間嘅 route 部分，畀 trainee 逐個 tap highlight
  // =====================================================================
  const fplText: string = flightData?.raw_simbrief?.atc?.flightplan_text || `(FPL-${flightData?.flight_no?.replace(" ", "") || 'CPA564'}-IS
-B773/H-SDE3GHIJ2J3J5M1RWXY/LB1
-${depIcao}${flightData?.std_z?.substring(0,4) || '0000'}
-N0480F${cruiseAlt.replace('FL', '')} ${routeStr} ${flightData?.sid_route || ''} DCT OCEAN DCT MKG DCT ${flightData?.star_route || ''}
-${arrIcao}0315 ${depIcao}
-REG/${reg.replace("-", "")} CAPT/${flightData?.commander_override?.replace(" ", "") || 'HILHORST'})`;

  // 🌟 split 埋 separator（保留返 whitespace/newline group），先可以原汁原味咁 render 返
  const fplParts = fplText.split(/(\s+)/);

  // 🌟 由 SID identifier 個 token 開始搵，去到（喺佢之後）第一個 STAR identifier
  // token 為止——中間逐個非空白 token 就係可以 highlight 嘅 route segment
  const sidIdent = sid && sid !== 'NIL' ? sid.toUpperCase() : null;
  const starIdent = star && star !== 'NIL' ? star.toUpperCase() : null;

  let sidPartIdx = -1;
  if (sidIdent) sidPartIdx = fplParts.findIndex((p) => p.trim().toUpperCase() === sidIdent);

  let starPartIdx = -1;
  if (starIdent) {
    for (let i = Math.max(sidPartIdx, 0); i < fplParts.length; i++) {
      if (fplParts[i].trim().toUpperCase() === starIdent) { starPartIdx = i; break; }
    }
  }

  const routeTokenPartIndices: number[] = [];
  if (sidPartIdx >= 0 && starPartIdx >= sidPartIdx) {
    for (let i = sidPartIdx; i <= starPartIdx; i++) {
      if (fplParts[i].trim().length > 0) routeTokenPartIndices.push(i);
    }
  }
  const totalRouteTokens = routeTokenPartIndices.length;
  const canHighlightRoute = totalRouteTokens > 0;

  const handleHighlightTap = () => {
    setHighlightCount((c) => (c >= totalRouteTokens ? 0 : c + 1));
  };
  const handleClearHighlight = () => setHighlightCount(0);

  return (
    // 🌟 Mobile：外層以前恆定 h-full overflow-hidden，兩個 panel 上下疊之後高度
    // 加埋一定爆晒個 modal，會靜靜雞裁走睇唔晒嘅嗰截。而家 mobile 淨係自然疊高，
    // 交返俾 DashboardModals.tsx 個 modal body 本身嘅 overflow-y-auto 去 scroll
    <div className="flex flex-col md:flex-row gap-6 md:h-full md:overflow-hidden min-h-0 w-full font-sans">
      
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
            {isEdgMraOver100 ? (
              <div className="bg-[#FF9100] text-black text-[0.75rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm animate-pulse leading-tight mt-0.5">
                <span className="text-[0.5rem]">▲</span> {edgMraStr}
              </div>
            ) : (
              <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{edgMraStr}</span>
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
        <div className="flex flex-wrap justify-between items-center mb-5 border-b border-[#333] pb-3 shrink-0 gap-3">
          <h2 className="text-lg font-bold text-white tracking-wide shrink-0">ICAO ATS FLIGHT PLAN</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleHighlightTap}
              disabled={!canHighlightRoute}
              title={canHighlightRoute ? undefined : "SID/STAR identifier not found in route text"}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-black text-[0.65rem] uppercase tracking-widest transition-colors ${
                !canHighlightRoute
                  ? 'bg-[#0a0a0a] border border-[#333] text-[#555] cursor-not-allowed'
                  : highlightCount >= totalRouteTokens
                    ? 'bg-[#C6FF00] text-black hover:bg-[#b0e600]'
                    : 'bg-[#2979FF] text-white hover:bg-blue-600'
              }`}
            >
              {!canHighlightRoute
                ? 'Highlight Route'
                : highlightCount === 0
                  ? '▶ Highlight Route'
                  : highlightCount >= totalRouteTokens
                    ? '✓ SID → STAR Complete'
                    : `Highlighting… ${highlightCount}/${totalRouteTokens}`}
            </button>
            {/* 🌟 一按清晒所有 highlight，唔使逐個 tap 返轉頭（同主掣個 cycle-back-to-0
                行為分開，隨時都可以即刻清） */}
            {highlightCount > 0 && (
              <button
                onClick={handleClearHighlight}
                title="Clear all highlighted route tokens"
                className="shrink-0 px-3 py-1.5 rounded-lg font-black text-[0.65rem] uppercase tracking-widest bg-[#0a0a0a] border border-[#FF1744]/50 text-[#FF1744] hover:bg-[#FF1744] hover:text-white transition-colors"
              >
                ✕ Clear Highlight
              </button>
            )}
          </div>
        </div>

        {/* ATS 電報模擬區 */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] font-mono text-[0.85rem] text-[#e2e8f0] whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner">
          {fplParts.map((part, idx) => {
            if (part.trim().length === 0) return <span key={idx}>{part}</span>;
            const rank = routeTokenPartIndices.indexOf(idx);
            const isHighlighted = rank !== -1 && rank < highlightCount;
            return (
              <span key={idx} className={isHighlighted ? 'bg-[#C6FF00] text-black rounded px-0.5 transition-colors' : ''}>
                {part}
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}