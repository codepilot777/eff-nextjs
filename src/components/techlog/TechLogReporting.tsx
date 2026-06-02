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
    <div className="w-full h-full flex justify-center items-center overflow-y-auto">
      <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-8 shadow-lg max-w-2xl w-full">
        <h3 className="text-2xl font-black text-[#00bfa5] mb-4">Log New Defect Entry</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#8fa0a6] mb-1">ATA Chapter</label>
            <select value={repCat} onChange={(e) => setRepCat(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] text-white p-3 rounded outline-none">
              <option>General / Unknown</option>
              <option>ATA 21 - Air Conditioning</option>
              <option>ATA 24 - Electrical Power</option>
              <option>ATA 27 - Flight Controls</option>
              <option>ATA 32 - Landing Gear</option>
            </select>
          </div>
          <div><label className="block text-xs font-bold text-[#8fa0a6] mb-1">Summary</label><input type="text" value={repSummary} onChange={(e) => setRepSummary(e.target.value)} placeholder="e.g. Flight deck door lock jam" className="w-full bg-[#1a1a1a] border border-[#404040] text-white p-3 rounded outline-none" /></div>
          <div><label className="block text-xs font-bold text-[#8fa0a6] mb-1">Details</label><textarea value={repDesc} onChange={(e) => setRepDesc(e.target.value)} className="w-full h-24 bg-[#1a1a1a] border border-[#404040] text-white p-3 rounded outline-none resize-none text-xs" /></div>
          <button onClick={handleSubmitReport} className="w-full py-4 bg-[#00bfa5] text-black font-black text-sm rounded-lg mt-2">SUBMIT DEFECT REPORT</button>
        </div>
      </div>
    </div>
  );
}