"use client";
import React, { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 🌟 將 WxCard 抽離主函數，效能更好，唔會重複 Render
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
  } else if (type === "TOFF_ALTN") {
    badgeStyle = "bg-[#2979FF]/15 text-[#2979FF] border-[#2979FF]/30";
    typeLabel = "TAKEOFF ALTN";
  } else if (type === "ENR_ALTN") {
    badgeStyle = "bg-[#FF9100]/15 text-[#FF9100] border-[#FF9100]/30";
    typeLabel = "ENROUTE ALTN";
  } else if (type === "ENR") {
    badgeStyle = "bg-[#8fa0a6]/15 text-[#8fa0a6] border-[#8fa0a6]/30";
    typeLabel = "ENROUTE STATION";
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

// 🌟 Props 大清洗：唔使再收 flightData
export default function Weather() {
  // 🌟 從天上直接抽取 Data
  const { flightData } = useFlightData();

  // 🌟 Enroute Stations 呢個分類可以成十幾個機場，預設收埋，trainee 想睇先展開，
  // 避免一入嚟就成頁都係機場卡片
  const [enrouteExpanded, setEnrouteExpanded] = useState(false);

  // 防呆保護：未有 data 就唔 render
  if (!flightData) return null;

  // 提取 SimBrief 原始數據與預設備降場
  const rawSb = flightData?.raw_simbrief || {};
  const alternates = flightData?.alternates || [];

  // 決定天氣顯示的優先順序
  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
    return "NO METAR/TAF DATA AVAILABLE";
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
      // 🌟 修復：以前呢度淨係讀原始 SimBrief 數據，完全跳過咗 WxTab.tsx 教官編輯/
      // AI 生成後寫入嘅 flightData.alternates[idx].metar/taf override，令教官「SAVE
      // & PUBLISH」咗都好，trainee 呢邊永遠見唔到，同 DEP/ARR 嘅正確行為唔一致
      renderList.push({
        id: `altn-${icao}-${idx}`,
        type: "ALTN",
        icao: icao,
        metar: getWx(alternates[idx]?.metar, altn.metar),
        taf: getWx(alternates[idx]?.taf, altn.taf)
      });
      seenIcaos.add(icao);
    }
  });

  // 🌟 4. 起飛備降場 (Takeoff Alternate)——同目的地備降場係唔同概念，SimBrief
  // raw data 有獨立嘅 takeoff_altn 分類，以前完全冇用過
  const toffAltn = rawSb.takeoff_altn;
  if (toffAltn?.icao_code && !seenIcaos.has(toffAltn.icao_code)) {
    renderList.push({
      id: `toff-altn-${toffAltn.icao_code}`,
      type: "TOFF_ALTN",
      icao: toffAltn.icao_code,
      metar: getWx(undefined, toffAltn.metar),
      taf: getWx(undefined, toffAltn.taf)
    });
    seenIcaos.add(toffAltn.icao_code);
  }

  // 🌟 5. 航路備降場 (Enroute Alternate)——ETOPS/EDTO 航班先會有，SimBrief raw data
  // 一樣未用過。可能係單一 object 或者 array，同 alternate 一樣要兼容兩種形狀
  const rawEnrouteAltn = rawSb.enroute_altn;
  const enrouteAltnArray = Array.isArray(rawEnrouteAltn) ? rawEnrouteAltn : (rawEnrouteAltn?.icao_code ? [rawEnrouteAltn] : []);
  enrouteAltnArray.forEach((ea: any, idx: number) => {
    const icao = ea.icao_code || ea.icao;
    if (icao && !seenIcaos.has(icao)) {
      renderList.push({
        id: `enr-altn-${icao}-${idx}`,
        type: "ENR_ALTN",
        icao: icao,
        metar: getWx(undefined, ea.metar),
        taf: getWx(undefined, ea.taf)
      });
      seenIcaos.add(icao);
    }
  });

  // 🌟 6. 航路沿途氣象站 (Enroute Stations)——SimBrief raw data 入面成十幾個機場，
  // 淨係呢類先摺埋（collapsed）＋滾動清單顯示，避免一開頁就成版都係機場卡片
  const rawEnrouteStations = Array.isArray(rawSb.enroute_station) ? rawSb.enroute_station : [];
  const enrouteStationList = rawEnrouteStations
    .filter((s: any) => (s.icao_code || s.icao) && !seenIcaos.has(s.icao_code || s.icao))
    .map((s: any, idx: number) => {
      const icao = s.icao_code || s.icao;
      seenIcaos.add(icao);
      return {
        id: `enr-station-${icao}-${idx}`,
        type: "ENR",
        icao,
        metar: getWx(undefined, s.metar),
        taf: getWx(undefined, s.taf)
      };
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

      {/* 🌟 Enroute Stations：摺埋嘅可展開區塊，展開先顯示滾動清單 */}
      {enrouteStationList.length > 0 && (
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl mb-5 shrink-0 shadow-lg overflow-hidden">
          <button
            onClick={() => setEnrouteExpanded((v) => !v)}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-[#252525] transition-colors outline-none"
          >
            <span className="text-white font-bold tracking-widest uppercase text-[0.9rem]">
              Enroute Weather Stations ({enrouteStationList.length})
            </span>
            <span className={`text-[#8fa0a6] text-2xl font-light transform transition-transform duration-200 ${enrouteExpanded ? 'rotate-180' : ''}`}>
              ›
            </span>
          </button>
          {enrouteExpanded && (
            <div className="border-t border-[#333333] p-5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
              {enrouteStationList.map((wx: any) => (
                <WxCard
                  key={wx.id}
                  type={wx.type}
                  icao={wx.icao}
                  metar={wx.metar}
                  taf={wx.taf}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
