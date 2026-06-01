"use client";

import { useState } from "react";

export default function Notam({ flightData }: { flightData: any }) {
  const [expanded, setExpanded] = useState<string | null>('dep');
  
  // 🌟 直接提取整包 SimBrief 原始數據
  const rawSb = flightData?.raw_simbrief || {};

  // 解析並清理 NOTAM 顯示
  const cleanNotam = (overrideValue: string | undefined, rawSbArray: any) => {
    // 1. 如果教官手動輸入了覆寫值，優先顯示教官的
    if (overrideValue && overrideValue !== "NIL") {
      return overrideValue;
    }

    // 2. 如果沒有覆寫，從 SimBrief Raw JSON 的陣列中解析出原汁原味的 NOTAM
    if (rawSbArray && Array.isArray(rawSbArray) && rawSbArray.length > 0) {
      return rawSbArray.map((n: any) => {
        // SimBrief JSON 中，真正的電報文字藏在 notam_raw 裡面
        return n.notam_raw || n.notam_text || n.message || String(n);
      }).join('\n\n------------------------------------------------------------\n\n');
    }

    return "No active NOTAMs available.";
  };

  const Accordion = ({ id, title, content }: { id: string, title: string, content: string }) => {
    const isOpen = expanded === id;
    return (
      <div className="border border-[#242f3d] rounded-lg mb-3 bg-[#11161d] overflow-hidden transition-all">
        <button 
          onClick={() => setExpanded(isOpen ? null : id)}
          className="w-full px-5 py-4 flex justify-between items-center bg-[#17202a] hover:bg-[#1e2a38] transition-colors"
        >
          <span className="font-bold text-[#00bfa5] text-lg">{title}</span>
          <span className="text-[#8fa0a6]">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="p-5 bg-[#0a0a0a] text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto pr-2 pb-10">
      <h2 className="text-2xl font-black text-white mb-6">📢 FLIGHT OPERATIONAL NOTAM BRIEFINGS</h2>
      
      <Accordion 
        id="dep" 
        title={`🛫 DEPARTURE: ${flightData?.dep_icao || 'N/A'}`} 
        content={cleanNotam(flightData?.notam_dep, rawSb.origin?.notam)} 
      />
      <Accordion 
        id="arr" 
        title={`🛬 ARRIVAL: ${flightData?.arr_icao || 'N/A'}`} 
        content={cleanNotam(flightData?.notam_arr, rawSb.destination?.notam)} 
      />
      
      {/* 備降機場 NOTAM：直接從 raw_simbrief.alternate 陣列中讀取 */}
      {(rawSb.alternate || flightData?.alternates || []).map((altn: any, idx: number) => {
        const icao = altn.icao_code || altn.icao;
        return (
          <Accordion 
            key={idx}
            id={`altn_${idx}`} 
            title={`🔄 ALTERNATE: ${icao}`} 
            content={cleanNotam(undefined, altn.notam)} 
          />
        );
      })}
    </div>
  );
}