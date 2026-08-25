"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 🌟 1. 移到外面：Cathay EFB 風格的 Accordion 組件 (防止 Re-render 丟失滾動位置)
const Accordion = ({
  id,
  type,
  icao,
  notams,
  expanded,
  setExpanded
}: {
  id: string,
  type: string,
  icao: string,
  notams: string[],
  expanded: string | null,
  setExpanded: (id: string | null) => void
}) => {
  const isOpen = expanded === id;

  // 根據 Type 設定 Badge 顏色
  let badgeStyle = "";
  let typeLabel = "";
  if (type === "DEP") {
    badgeStyle = "bg-[#2979FF]/15 text-[#2979FF] border-[#2979FF]/30";
    typeLabel = "DEPARTURE";
  } else if (type === "ARR") {
    // 🌟 順手更新：將 Arrival 換成標誌性的 #C6FF00 螢光青色
    badgeStyle = "bg-[#C6FF00]/15 text-[#C6FF00] border-[#C6FF00]/30";
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
    <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl mb-5 shrink-0 shadow-lg flex flex-col font-sans overflow-hidden transition-all">
      {/* Clickable Header */}
      <button
        onClick={() => setExpanded(isOpen ? null : id)}
        className="w-full px-5 py-4 flex justify-between items-center bg-[#1E1E1E] hover:bg-[#252525] transition-colors outline-none"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-white tracking-widest">{icao}</h2>
          <div className={`px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider border ${badgeStyle}`}>
            {typeLabel}
          </div>
        </div>
        <span className={`text-[#8fa0a6] text-2xl font-light transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ›
        </span>
      </button>

      {/* Expanded Content Area */}
      {isOpen && (
        <div className="bg-[#0a0a0a] border-t border-[#333333] p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
          {notams.map((notamText, idx) => (
            <div
              key={idx}
              className="text-[#e2e8f0] font-mono text-[0.85rem] whitespace-pre-wrap leading-relaxed pb-4 border-b border-[#2a2a2a] last:border-0 last:pb-0"
            >
              {notamText}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🌟 Props 大清洗：唔使再收 flightData
export default function Notam() {
  const [expanded, setExpanded] = useState<string | null>('dep');

  // 🌟 Enroute Stations 呢個分類可以成十幾個機場，預設收埋，trainee 想睇先展開，
  // 避免一入嚟就成頁都係機場 Accordion
  const [enrouteExpanded, setEnrouteExpanded] = useState(false);
  const [enrouteItemExpanded, setEnrouteItemExpanded] = useState<string | null>(null);

  // 🌟 從天上直接抽取 Data
  const { flightData } = useFlightData();

  // 防呆保護
  if (!flightData) return null;

  // 提取整包 SimBrief 原始數據
  const rawSb = flightData?.raw_simbrief || {};
  const alternates = flightData?.alternates || [];

  // 解析並回傳 Array
  const parseNotams = (overrideValue: string | undefined, rawSbArray: any): string[] => {
    if (overrideValue && overrideValue !== "NIL") {
      return [overrideValue];
    }
    if (rawSbArray && Array.isArray(rawSbArray) && rawSbArray.length > 0) {
      return rawSbArray.map((n: any) => n.notam_raw || n.notam_text || n.message || String(n));
    }
    return ["No active NOTAMs available."];
  };

  // 過濾重複機場的邏輯 (Deduplication Logic)
  const renderList = [];
  const seenIcaos = new Set<string>();

  // 1. 處理出發地
  if (flightData?.dep_icao) {
    renderList.push({
      id: `dep`,
      type: "DEP",
      icao: flightData.dep_icao,
      notams: parseNotams(flightData?.notam_dep, rawSb.origin?.notam)
    });
    seenIcaos.add(flightData.dep_icao);
  }

  // 2. 處理目的地 (如果與出發地不同)
  if (flightData?.arr_icao && !seenIcaos.has(flightData.arr_icao)) {
    renderList.push({
      id: `arr`,
      type: "ARR",
      icao: flightData.arr_icao,
      notams: parseNotams(flightData?.notam_arr, rawSb.destination?.notam)
    });
    seenIcaos.add(flightData.arr_icao);
  }

  // 3. 處理備降場 (如果與起降地都不同)
  const rawAltn = rawSb.alternate;
  const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : alternates);

  altnArray.forEach((altn: any, idx: number) => {
    const icao = altn.icao_code || altn.icao;
    if (icao && !seenIcaos.has(icao)) {
      // 🌟 修復：以前呢度個 overrideValue 寫死 undefined，完全跳過咗
      // NotamTab.tsx 教官編輯/AI 生成後寫入嘅 flightData.alternates[idx].notam，
      // 同 DEP/ARR 嘅正確行為唔一致
      renderList.push({
        id: `altn-${idx}`,
        type: "ALTN",
        icao: icao,
        notams: parseNotams(alternates[idx]?.notam, altn.notam)
      });
      seenIcaos.add(icao);
    }
  });

  // 🌟 4. 起飛備降場 (Takeoff Alternate)——同目的地備降場係唔同概念，SimBrief
  // raw data 有獨立嘅 takeoff_altn 分類，以前完全冇用過
  const toffAltn = rawSb.takeoff_altn;
  if (toffAltn?.icao_code && !seenIcaos.has(toffAltn.icao_code)) {
    renderList.push({
      id: `toff-altn`,
      type: "TOFF_ALTN",
      icao: toffAltn.icao_code,
      notams: parseNotams(undefined, toffAltn.notam)
    });
    seenIcaos.add(toffAltn.icao_code);
  }

  // 🌟 5. 航路備降場 (Enroute Alternate)——ETOPS/EDTO 航班先會有
  const rawEnrouteAltn = rawSb.enroute_altn;
  const enrouteAltnArray = Array.isArray(rawEnrouteAltn) ? rawEnrouteAltn : (rawEnrouteAltn?.icao_code ? [rawEnrouteAltn] : []);
  enrouteAltnArray.forEach((ea: any, idx: number) => {
    const icao = ea.icao_code || ea.icao;
    if (icao && !seenIcaos.has(icao)) {
      renderList.push({
        id: `enr-altn-${idx}`,
        type: "ENR_ALTN",
        icao: icao,
        notams: parseNotams(undefined, ea.notam)
      });
      seenIcaos.add(icao);
    }
  });

  // 🌟 6. 航路沿途機場 NOTAM (Enroute Stations)——SimBrief raw data 入面成十幾個
  // 機場，淨係呢類先摺埋（collapsed）＋滾動清單顯示，避免一開頁就成版都係 Accordion
  const rawEnrouteStations = Array.isArray(rawSb.enroute_station) ? rawSb.enroute_station : [];
  const enrouteStationList = rawEnrouteStations
    .filter((s: any) => (s.icao_code || s.icao) && !seenIcaos.has(s.icao_code || s.icao))
    .map((s: any, idx: number) => {
      const icao = s.icao_code || s.icao;
      seenIcaos.add(icao);
      return {
        id: `enr-station-${idx}`,
        type: "ENR",
        icao,
        notams: parseNotams(undefined, s.notam)
      };
    });

  return (
    <div className="h-full w-full overflow-y-auto pr-2 pb-10 animate-fade-in scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">

      {/* 標題與 Icon */}
      <div className="flex items-center gap-3 mb-6 mt-2 ml-1">
         <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#333] flex items-center justify-center text-white">
           <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
         </div>
         <h2 className="text-lg font-bold text-white tracking-wide">NOTAM Briefing</h2>
      </div>

      {/* 依序渲染去重後的 NOTAM Accordions */}
      {renderList.map((item) => (
        <Accordion
          key={item.id}
          id={item.id}
          type={item.type}
          icao={item.icao}
          notams={item.notams}
          expanded={expanded}
          setExpanded={setExpanded}
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
              Enroute NOTAMs ({enrouteStationList.length})
            </span>
            <span className={`text-[#8fa0a6] text-2xl font-light transform transition-transform duration-200 ${enrouteExpanded ? 'rotate-180' : ''}`}>
              ›
            </span>
          </button>
          {enrouteExpanded && (
            <div className="border-t border-[#333333] p-5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
              {enrouteStationList.map((item: any) => (
                <Accordion
                  key={item.id}
                  id={item.id}
                  type={item.type}
                  icao={item.icao}
                  notams={item.notams}
                  expanded={enrouteItemExpanded}
                  setExpanded={setEnrouteItemExpanded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
