"use client";

import { useState } from "react";

export default function TechLogReporting({ tlData, updateTechLogData, roleMode, setActiveNav }: any) {
  const [repCat, setRepCat] = useState("General / Unknown");
  const [repSummary, setRepSummary] = useState("");
  const [repDesc, setRepDesc] = useState("");

  const handleSubmitReport = () => {
    if (!repSummary || !repDesc) return alert("Summary and Description required.");
    const newDefect = {
      id: `TL-${Math.floor(1000 + Math.random() * 9000)}`,
      ata: repCat.split(" ")[1] || "00",
      description: `[${repCat}] ${repSummary} - ${repDesc}`,
      status: "OPEN",
      time: new Date().toISOString().substring(11, 16) + "Z",
      reported_by: roleMode
    };
    updateTechLogData({ defects: [...(tlData?.defects || []), newDefect], tl_defects: false });
    setRepSummary(""); setRepDesc(""); setActiveNav("dashboard");
    alert("Defect logged into Aircraft Maintenance Book.");
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
            className="w-full py-4.5 mt-4 bg-[#00E676] text-black font-black tracking-widest uppercase text-[0.8rem] rounded-xl hover:bg-[#00c263] transition-colors shadow-[0_4px_15px_rgba(0,230,118,0.3)] flex items-center justify-center gap-3"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Submit Defect Report
          </button>
        </div>

      </div>
    </div>
  );
}