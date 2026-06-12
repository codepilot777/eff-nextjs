"use client";
import React from "react";

export default function Weather({ flightData }: { flightData: any }) {
  // 提取 SimBrief 原始數據與預設備降場
  const rawSb = flightData?.raw_simbrief || {};
  const alternates = flightData?.alternates || [];

  // 決定天氣顯示的優先順序
  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
    return "NO METAR/TAF DATA AVAILABLE";
  };

  // 🌟 Cathay EFB 風格的天氣卡片
  const WxCard = ({ type, icao, metar, taf }: { type: string, icao: string, metar: string, taf: string }) => {
    
    // 根據 Type 設定 Badge 顏色
    let badgeStyle = "";
    let typeLabel = "";
    if (type === "DEP") {
      badgeStyle = "bg-[#2979FF]/15 text-[#2979FF] border-[#2979FF]/30";
      typeLabel = "DEPARTURE";
    } else if (type === "ARR") {
      badgeStyle = "bg-[#00E676]/15 text-[#00E676] border-[#00E676]/30";
      typeLabel = "ARRIVAL";
    } else {
      badgeStyle = "bg-[#FF9100]/15 text-[#FF9100] border-[#FF9100]/30";
      typeLabel = "ALTERNATE";
    }

    return (
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 mb-5 shrink-0 shadow-lg flex flex-col font-sans">
        
        {/* Header 區塊 */}
        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-widest">{icao}</h2>
            <div className={`px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider border ${badgeStyle}`}>
              {typeLabel}
            </div>
          </div>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        
        {/* METAR / TAF 內容區塊 */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-[0.65rem] mb-1.5 uppercase tracking-widest">METAR</h3>
            <div className="bg-[#0a0a0a] p-3.5 rounded-lg text-[#e2e8f0] font-mono text-[0.85rem] whitespace-pre-wrap border border-[#2a2a2a] leading-relaxed">
              {metar}
            </div>
          </div>
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-[0.65rem] mb-1.5 uppercase tracking-widest">TAF</h3>
            <div className="bg-[#0a0a0a] p-3.5 rounded-lg text-[#e2e8f0] font-mono text-[0.85rem] whitespace-pre-wrap border border-[#2a2a2a] leading-relaxed">
              {taf}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🌟 過濾重複機場的邏輯 (Deduplication Logic)
  const renderList = [];
  const seenIcaos = new Set<string>();

  // 1. 處理出發地
  if (flightData?.dep_icao) {
    renderList.push({
      id: `dep-${flightData.dep_icao}`,
      type: "DEP",
      icao: flightData.dep_icao,
      metar: getWx(flightData?.metar_dep, rawSb.origin?.metar),
      taf: getWx(flightData?.taf_dep, rawSb.origin?.taf)
    });
    seenIcaos.add(flightData.dep_icao);
  }

  // 2. 處理目的地 (如果與出發地不同)
  if (flightData?.arr_icao && !seenIcaos.has(flightData.arr_icao)) {
    renderList.push({
      id: `arr-${flightData.arr_icao}`,
      type: "ARR",
      icao: flightData.arr_icao,
      metar: getWx(flightData?.metar_arr, rawSb.destination?.metar),
      taf: getWx(flightData?.taf_arr, rawSb.destination?.taf)
    });
    seenIcaos.add(flightData.arr_icao);
  }

  // 3. 處理備降場 (如果與起降地都不同)
  const rawAltn = rawSb.alternate;
  const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : alternates);

  altnArray.forEach((altn: any, idx: number) => {
    const icao = altn.icao_code || altn.icao;
    if (icao && !seenIcaos.has(icao)) {
      renderList.push({
        id: `altn-${icao}-${idx}`,
        type: "ALTN",
        icao: icao,
        metar: altn.metar || "NO METAR FILED",
        taf: altn.taf || "NO TAF FILED"
      });
      seenIcaos.add(icao);
    }
  });

  return (
    <div className="h-full w-full overflow-y-auto pr-2 pb-10 animate-fade-in">
      
      {/* 標題與 Icon */}
      <div className="flex items-center gap-3 mb-6 mt-2 ml-1">
         <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center text-white">
           <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
             <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
           </svg>
         </div>
         <h2 className="text-lg font-bold text-white tracking-wide">Weather Briefing</h2>
      </div>
      
      {/* 依序渲染去重後的氣象卡片 */}
      {renderList.map((wx) => (
        <WxCard 
          key={wx.id}
          type={wx.type}
          icao={wx.icao} 
          metar={wx.metar} 
          taf={wx.taf} 
        />
      ))}
      
    </div>
  );
}