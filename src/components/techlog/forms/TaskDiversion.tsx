"use client";
import { useState } from "react";
import { finalizeSector } from "./sharedUtils";
import { BlockTimesGrid } from "./shared/BlockTimesGrid";
import { OperationsCountersGrid } from "./shared/OperationsCountersGrid";
import { EdtoAutolandSelects } from "./shared/EdtoAutolandSelects";

export function TaskDiversion({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncTakeOff, setNcTakeOff] = useState("");
  const [ncLanding, setNcLanding] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncLandingsCount, setNcLandingsCount] = useState("1");
  const [ncOvershoots, setNcOvershoots] = useState("0");
  const [ncTouchGo, setNcTouchGo] = useState("0");
  const [ncEdto, setNcEdto] = useState("No");
  const [ncAutoland, setNcAutoland] = useState("Not Attempted");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");
  const [divArrival, setDivArrival] = useState("");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff.trim() !== "" && ncTakeOff.trim() !== "" && ncLanding.trim() !== "" && ncBlocksOn.trim() !== "" && ncLandingsCount !== "" && ncOvershoots !== "" && ncTouchGo !== "" && ncArrivalFuel.trim() !== "" && divArrival.trim() !== "" && ncCmdr.trim() !== "" && ncGalaxyId.trim() !== "";

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header (橙色主題) */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#FF9100] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        In-Flight Diversion
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* Confirm Nil Defects Toggle */}
        {!hasOpenDefects && (
          <div 
            onClick={() => setNcNilDefects(!ncNilDefects)} 
            className={`flex items-center justify-between bg-[#0a0a0a] border p-5 rounded-xl cursor-pointer transition-colors select-none shadow-inner ${ncNilDefects ? 'border-[#FF9100]/50' : 'border-[#444] hover:border-[#666]'}`}
          >
            <div className="flex flex-col">
              <div className={`font-bold uppercase tracking-widest text-[0.75rem] transition-colors ${ncNilDefects ? 'text-[#FF9100]' : 'text-white'}`}>Confirm Nil Defects</div>
              <div className="text-[#555] text-[0.65rem] mt-1.5 font-bold uppercase tracking-widest">No defects were reported during this sector.</div>
            </div>
            <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${ncNilDefects ? 'bg-[#FF9100]' : 'bg-[#333]'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        )}

        {/* 🌟 Block Times */}
        <BlockTimesGrid
          theme="orange"
          blocksOff={ncBlocksOff} setBlocksOff={setNcBlocksOff}
          takeOff={ncTakeOff} setTakeOff={setNcTakeOff}
          landing={ncLanding} setLanding={setNcLanding}
          blocksOn={ncBlocksOn} setBlocksOn={setNcBlocksOn}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Operations Counters */}
        <OperationsCountersGrid
          theme="orange"
          landingsCount={ncLandingsCount} setLandingsCount={setNcLandingsCount}
          overshoots={ncOvershoots} setOvershoots={setNcOvershoots}
          touchGo={ncTouchGo} setTouchGo={setNcTouchGo}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 EDTO & Autoland */}
        <EdtoAutolandSelects
          theme="orange"
          edto={ncEdto} setEdto={setNcEdto}
          autoland={ncAutoland} setAutoland={setNcAutoland}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Fuel & Station (Diversion 重點) */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#FF9100] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Arrival Fuel</span>
              <span className="text-[#555]">T (KGS x 1000)</span>
            </label>
            <input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#FF9100]/50 p-4 rounded-xl font-mono font-bold text-[#FF9100] text-lg outline-none focus:border-[#FF9100] shadow-inner transition-colors placeholder:text-[#444]" placeholder="e.g. 8.5" />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Arrival Station (Diversion)</label>
            <input type="text" value={divArrival} onChange={e=>setDivArrival(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white text-lg outline-none focus:border-[#FF9100] uppercase shadow-inner transition-colors placeholder:text-[#333]" placeholder="e.g. RCTP" maxLength={4} />
          </div>
        </div>

        {/* 🌟 Commander Details */}
        <div className="grid grid-cols-2 gap-5 mt-2">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander's Name</label>
            <input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#FF9100] uppercase shadow-inner transition-colors" />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
            <input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#FF9100] uppercase shadow-inner transition-colors" />
          </div>
        </div>

      </div>

      {/* 🌟 底部 Confirm 按鈕 */}
      {isValid ? (
        <button 
          onClick={() => finalizeSector("Diversion", divArrival, ncArrivalFuel, { cmdr: ncCmdr, blocksOff: ncBlocksOff, takeOff: ncTakeOff, landing: ncLanding, blocksOn: ncBlocksOn, edto: ncEdto, autoland: ncAutoland, landingsCount: ncLandingsCount, overshoots: ncOvershoots, touchGo: ncTouchGo }, tlData, updateTechLogData, setActiveTask)} 
          className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 bg-[#FF9100] text-black hover:bg-[#e68a00] shadow-[0_4px_15px_rgba(255,145,0,0.3)]"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Confirm Diversion
        </button>
      ) : (
        <div className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed">
          Please fill in all required fields
        </div>
      )}
    </div>
  );
}