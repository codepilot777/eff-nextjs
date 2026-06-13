"use client";
import { useState } from "react";
import { finalizeSector } from "./sharedUtils";

export function TaskGroundReturn({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff.trim() !== "" && ncBlocksOn.trim() !== "" && ncArrivalFuel.trim() !== "" && ncCmdr.trim() !== "" && ncGalaxyId.trim() !== "";

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header (紅色主題) */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#FF1744] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
        Ground Return
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* Confirm Nil Defects Toggle */}
        {!hasOpenDefects && (
          <div 
            onClick={() => setNcNilDefects(!ncNilDefects)} 
            className={`flex items-center justify-between bg-[#0a0a0a] border p-5 rounded-xl cursor-pointer transition-colors select-none shadow-inner ${ncNilDefects ? 'border-[#FF1744]/50' : 'border-[#444] hover:border-[#666]'}`}
          >
            <div className="flex flex-col">
              <div className={`font-bold uppercase tracking-widest text-[0.75rem] transition-colors ${ncNilDefects ? 'text-[#FF1744]' : 'text-white'}`}>Confirm Nil Defects</div>
              <div className="text-[#555] text-[0.65rem] mt-1.5 font-bold uppercase tracking-widest">No defects were reported during this taxi segment.</div>
            </div>
            <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${ncNilDefects ? 'bg-[#FF1744]' : 'bg-[#333]'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        )}

        {/* 🌟 Block Times (只有 Off 同 On，無起飛降落) */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.6rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Blocks Off (Z)</label>
            <input 
              type="text" 
              value={ncBlocksOff} 
              onChange={e => setNcBlocksOff(e.target.value)} 
              className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl font-mono font-bold text-white text-center outline-none focus:border-[#FF1744] transition-colors shadow-inner placeholder:text-[#333]" 
              placeholder="e.g. 0215" 
              maxLength={4}
            />
          </div>
          <div>
            <label className="block text-[0.6rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Blocks On (Z)</label>
            <input 
              type="text" 
              value={ncBlocksOn} 
              onChange={e => setNcBlocksOn(e.target.value)} 
              className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl font-mono font-bold text-white text-center outline-none focus:border-[#FF1744] transition-colors shadow-inner placeholder:text-[#333]" 
              placeholder="e.g. 0245" 
              maxLength={4}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Fuel & Station (Arrival Station 被強制設為 Origin) */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#FF1744] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Arrival Fuel</span>
              <span className="text-[#555]">T (KGS x 1000)</span>
            </label>
            <input 
              type="number" step="0.1" 
              value={ncArrivalFuel} 
              onChange={e => setNcArrivalFuel(e.target.value)} 
              className="w-full bg-[#0a0a0a] border border-[#FF1744]/50 p-4 rounded-xl font-mono font-bold text-[#FF1744] text-lg outline-none focus:border-[#FF1744] shadow-inner transition-colors placeholder:text-[#444]" 
              placeholder="e.g. 40.5" 
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Arrival Station (Ground Return)</label>
            <input 
              type="text" 
              value={tlData?.tl_prep_dep || "HKG"} 
              disabled 
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] text-center text-lg outline-none cursor-not-allowed shadow-inner uppercase" 
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Commander Details */}
        <div className="grid grid-cols-2 gap-5 mt-1">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander's Name</label>
            <input 
              type="text" 
              value={ncCmdr} 
              onChange={e => setNcCmdr(e.target.value.toUpperCase())} 
              className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#FF1744] uppercase shadow-inner transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
            <input 
              type="text" 
              value={ncGalaxyId} 
              onChange={e => setNcGalaxyId(e.target.value.toUpperCase())} 
              className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#FF1744] uppercase shadow-inner transition-colors" 
            />
          </div>
        </div>

      </div>

      {/* 🌟 底部 Confirm 按鈕 */}
      {isValid ? (
        <button 
          onClick={() => finalizeSector("Ground Return", tlData?.tl_prep_dep || "HKG", ncArrivalFuel, { cmdr: ncCmdr, blocksOff: ncBlocksOff, blocksOn: ncBlocksOn }, tlData, updateTechLogData, setActiveTask)} 
          className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 bg-[#FF1744] text-white hover:bg-[#D50000] shadow-[0_4px_15px_rgba(255,23,68,0.3)]"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Confirm Ground Return
        </button>
      ) : (
        <div className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed">
          Please fill in all required fields
        </div>
      )}
    </div>
  );
}