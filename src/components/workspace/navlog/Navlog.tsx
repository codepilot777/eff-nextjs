"use client";

import React, { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import NavlogDepRow from "./NavlogDepRow";
import NavlogWaypointRow from "./NavlogWaypointRow";

export default function Navlog() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { flightData } = useFlightData();

  if (!flightData) return null;

  const rawNavlog = flightData?.raw_simbrief?.navlog?.fix || flightData?.navlog || [];
  const rawOrigin = flightData?.raw_simbrief?.origin || {};
  
  const rawFirsObj = flightData?.raw_simbrief?.firs?.fir;
  const rawFirs = Array.isArray(rawFirsObj) ? rawFirsObj : (rawFirsObj ? [rawFirsObj] : []);

  // 🌟 計算 Initial FIR
  const initialFirIcao = rawNavlog[0]?.fir || rawOrigin.fir || "VHHK";
  const matchedFir = rawFirs.find((f: any) => f.icao === initialFirIcao);
  const initialFirName = matchedFir?.name || ""; 
  
  let initialFirText = `${initialFirIcao} ${initialFirName}`.trim();
  if (!initialFirText.includes("FIR")) initialFirText += " FIR";

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] overflow-hidden rounded-lg border border-[#333333] relative">
      
      {/* 1. 標題列 */}
      <div className="flex bg-[#1e1e1e] text-[#a0a0a0] font-mono text-[0.65rem] px-3 py-1 uppercase border-b border-[#333] shrink-0 z-50">
        <div className="flex-[1.6]">Waypoint</div>
        <div className="flex-[2.4]">FL / MORA &nbsp;&nbsp;&nbsp; MTR / DIS / GS</div>
        <div className="flex-[2.6]">LAT/LONG &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; WIND / WEIGHT</div>
        <div className="flex-[1.0] text-right">REQ FUEL / ACTUAL</div>
        <div className="flex-[1.0] text-right">TIME / ATA</div>
      </div>
      
      {/* 滾動區域 */}
      <div className="flex-1 overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent relative">
        
        {/* 2. 初始 FIR Header */}
        <div className="sticky top-0 z-40 bg-[#d1bfae] text-[#111] font-black font-mono text-[0.75rem] px-3 py-0.5 flex justify-between shrink-0 shadow-sm border-b border-[#111]">
          <span>FIR &nbsp;&nbsp;&nbsp; {initialFirText}</span>
          <span>{initialFirText} &nbsp;&nbsp;&nbsp; FIR</span>
        </div>

        {/* 3. 出發機場行 */}
        <NavlogDepRow />

        {/* 4. 航點列表 */}
        {rawNavlog.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No detailed NavLog available from this flight plan.</div>
        ) : (
          rawNavlog.map((fix: any, i: number) => (
            <NavlogWaypointRow 
              key={i} 
              fix={fix} 
              index={i} 
              isExpanded={expandedRow === i} 
              onToggleExpand={() => setExpandedRow(expandedRow === i ? null : i)}
            />
          ))
        )}
      </div>
    </div>
  );
}