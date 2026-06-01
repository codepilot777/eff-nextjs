"use client";

import { useState } from "react";

export default function Notam({ flightData }: { flightData: any }) {
  const [expanded, setExpanded] = useState<string | null>('dep');

  // 解析 JSON 格式或純文字的 NOTAM
  const cleanNotam = (raw: string | undefined) => {
    if (!raw) return "No active NOTAMs.";
    try {
      if (raw.startsWith('[') || raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(n => n.notam_raw || n.message || String(n)).join('\n\n');
        return parsed.notam_raw || parsed.message || String(parsed);
      }
    } catch (e) {}
    return raw.replace(/^\['|'\]$/g, '');
  };

  const alternates = flightData?.alternates || [];

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
          <div className="p-5 bg-[#0a0a0a] text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
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
        content={cleanNotam(flightData?.notam_dep)} 
      />
      <Accordion 
        id="arr" 
        title={`🛬 ARRIVAL: ${flightData?.arr_icao || 'N/A'}`} 
        content={cleanNotam(flightData?.notam_arr)} 
      />
      
      {alternates.map((altn: any, idx: number) => (
        <Accordion 
          key={idx}
          id={`altn_${idx}`} 
          title={`🔄 ALTERNATE: ${altn.icao}`} 
          content={cleanNotam(altn.notam || "No active NOTAMs.")} 
        />
      ))}
    </div>
  );
}