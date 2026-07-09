"use client";

import { useState } from "react";

const FLIGHT_PHASES = ["PREFLIGHT", "TRANSIT", "INFLIGHT"];

export default function TechLogReporting({ tlData, updateTechLogData, roleMode, setActiveNav }: any) {
  const [repCat, setRepCat] = useState("General / Unknown");
  const [repSummary, setRepSummary] = useState("");
  const [repDesc, setRepDesc] = useState("");
  const [repPhase, setRepPhase] = useState(tlData?.tl_flight_started ? "INFLIGHT" : "PREFLIGHT");

  const handleSubmitReport = () => {
    if (!repSummary || !repDesc) return alert("Summary and Description required.");

    const randomTlId = `TL-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullDescription = `[${repCat}] ${repSummary} - ${repDesc}`;
    const nowZ = new Date().toISOString().substring(11, 16) + "Z";

    const newDefect = {
      id: randomTlId,
      ata: repCat.split(" ")[1] || "00",
      description: fullDescription,
      status: "OPEN",
      time: nowZ,
      reported_time: nowZ,
      flight_phase: repPhase,
      reported_by: roleMode
    };

    // 🌟 全新加入：機長報完，即刻留底入 Action Log
    const newEntry = {
      id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
      time: nowZ,
      action: "DEFECT RAISED",
      ref: randomTlId,
      original_desc: fullDescription, // 記低原始問題
      desc: "Snag reported. Pending Engineer action.",
      sign: `CMDR SYSTEM`
    };

    // 🌟 用 defectAppend/tlEntryAppend directive 淨係加返一條新資料，
    // 唔再send成個 defects/tl_entries array，避免蓋走另一邊嘅並發改動
    updateTechLogData({
      defectAppend: newDefect,
      tlEntryAppend: newEntry,
      data: { tl_defects: false },
    });

    setRepSummary(""); setRepDesc(""); setActiveNav("dashboard");
    alert(`Snag reported successfully under reference ${randomTlId}.`);
  };

  return (
    <div className="w-full h-full flex justify-center items-start pt-8 pb-8 overflow-y-auto font-sans scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4">
        
        {/* 🌟 標題 */}
        <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-8 flex items-center gap-3">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Log New Defect Entry
        </h3>
        
        {/* 🌟 表單內容 */}
        <div className="flex flex-col gap-6">
          
          {/* ATA Chapter */}
          <div>
            <label className="block text-[0.65rem] font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
              ATA Chapter
            </label>
            <div className="relative">
              <select 
                value={repCat} 
                onChange={(e) => setRepCat(e.target.value)} 
                className="w-full bg-[#0a0a0a] border border-[#444] text-white p-4 rounded-xl outline-none appearance-none cursor-pointer focus:border-[#00E676] transition-colors text-sm font-bold shadow-inner"
              >
                <option>General / Unknown</option>
                <option>ATA 21 - Air Conditioning</option>
                <option>ATA 24 - Electrical Power</option>
                <option>ATA 27 - Flight Controls</option>
                <option>ATA 32 - Landing Gear</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#8fa0a6]">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>
            </div>
          </div>

          {/* Flight Phase */}
          <div>
            <label className="block text-[0.65rem] font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
              Flight Phase
            </label>
            <div className="relative">
              <select
                value={repPhase}
                onChange={(e) => setRepPhase(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#444] text-white p-4 rounded-xl outline-none appearance-none cursor-pointer focus:border-[#00E676] transition-colors text-sm font-bold shadow-inner"
              >
                {FLIGHT_PHASES.map((phase) => <option key={phase}>{phase}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#8fa0a6]">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-[0.65rem] font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
              Summary
            </label>
            <input 
              type="text" 
              value={repSummary} 
              onChange={(e) => setRepSummary(e.target.value)} 
              placeholder="e.g. Flight deck door lock jam" 
              className="w-full bg-[#0a0a0a] border border-[#444] text-white p-4 rounded-xl outline-none focus:border-[#00E676] transition-colors text-sm font-mono placeholder:text-[#555] placeholder:font-sans shadow-inner" 
            />
          </div>
          
          {/* Details */}
          <div>
            <label className="block text-[0.65rem] font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
              Details
            </label>
            <textarea 
              value={repDesc} 
              onChange={(e) => setRepDesc(e.target.value)} 
              placeholder="Provide full description of the defect observed..."
              className="w-full h-32 bg-[#0a0a0a] border border-[#444] text-white p-4 rounded-xl outline-none resize-none focus:border-[#00E676] transition-colors text-sm font-mono placeholder:text-[#555] placeholder:font-sans shadow-inner leading-relaxed" 
            />
          </div>
          
          {/* Submit Button */}
          <button 
            onClick={handleSubmitReport} 
            className="w-full py-4.5 mt-4 bg-[#C6FF00] text-black font-black tracking-widest uppercase text-[0.8rem] rounded-xl hover:bg-[#a8db00] transition-colors shadow-[0_4px_15px_rgba(198,255,0,0.3)] flex items-center justify-center gap-3"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Submit Defect Report
          </button>
        </div>

      </div>
    </div>
  );
}