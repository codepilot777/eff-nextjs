"use client";
import { useState } from "react";
import { PMDG_FAILURES, PmdgCommand } from "@/data/pmdgCommands";
import { sendPMDGControl, fireCDUMacro } from "@/services/pmdgService";

export default function FailuresView({ isConnected, sendToFSUIPC }: any) {
  const [isArmed, setIsArmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredFailures = PMDG_FAILURES.filter((f) => 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (selectedCategory === "ALL" || f.category === selectedCategory)
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#151515] p-3 rounded-xl border border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-500 pl-2">🔍</span>
          <input type="text" placeholder="SEARCH FAILURE..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent text-sm font-mono focus:outline-none w-full text-white placeholder-gray-600 uppercase tracking-wider" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto py-1">
          {["ALL", "ENGINE", "HYDRAULIC", "ELECTRICAL", "FUEL", "AIR"].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded text-[0.65rem] font-mono font-black tracking-widest transition-all ${selectedCategory === cat ? "bg-[#00bfa5] text-black" : "bg-[#252525] text-gray-400 hover:text-white"}`}>{cat}</button>
          ))}
        </div>
        <button onClick={() => setIsArmed(!isArmed)} className={`px-5 py-2 rounded-lg font-mono text-xs font-black tracking-widest transition-all ${isArmed ? "bg-[#FF1744] text-white animate-pulse border border-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.4)]" : "bg-[#2A2A2A] text-gray-500 border border-[#444]"}`}>
          {isArmed ? "⚠️ INJECTION ARMED" : "🔒 INJECTION SAFE"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 content-start">
        {filteredFailures.map((f: PmdgCommand) => (
          <button
            key={f.id} disabled={!isArmed || !isConnected}
            onClick={() => {
              if (f.macroSequence) fireCDUMacro(sendToFSUIPC, f.macroSequence);
              else if (f.eventId) sendPMDGControl(sendToFSUIPC, f.eventId);
              alert(`🚀 Sabotage injected: ${f.name}`);
            }}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all select-none group min-h-[90px] relative ${!isConnected ? "bg-[#222]/30 border-[#333] opacity-30 cursor-not-allowed" : !isArmed ? "bg-[#252525] border-[#333] opacity-50 cursor-not-allowed" : f.severity === "CRITICAL" ? "bg-[#2A1518] border-[#FF1744]/30 hover:border-[#FF1744] active:scale-95 shadow-sm hover:shadow-[#FF1744]/10" : "bg-[#2A2115] border-[#FF9100]/30 hover:border-[#FF9100] active:scale-95 shadow-sm hover:shadow-[#FF9100]/10"}`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[0.6rem] font-mono font-bold uppercase tracking-widest text-gray-500 px-1.5 py-0.5 rounded bg-black/40">{f.category || "SYS"}</span>
              <span className={`w-2 h-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-[#FF1744]' : 'bg-[#FF9100]'}`} />
            </div>
            <h5 className={`text-xs font-black uppercase tracking-wide mt-2 ${!isArmed ? 'text-gray-400' : 'text-white'}`}>{f.name}</h5>
          </button>
        ))}
      </div>
    </div>
  );
}